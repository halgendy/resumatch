import fs from 'fs';
import path from 'path';
import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nunjucks Config
const env = nunjucks.configure(path.join(__dirname, '../templates'), {
    autoescape: false,
    tags: {
        blockStart: '<%',
        blockEnd: '%>',
        variableStart: '<<',
        variableEnd: '>>',
        commentStart: '<#',
        commentEnd: '#>',
    },
});

env.addFilter('escape_tex', (text) => {
    if (typeof text !== 'string') return text;
    if (text === 'C#') return '\\CS';
    if (text === 'C++') return '\\CPP';

    let escaped = text.replace(/[&%$#_{}~^\\]/g, (match) => {
        const replacements = {
            '&': '\\&',
            '%': '\\%',
            $: '\\$',
            '#': '\\#',
            _: '\\_',
            '{': '\\{',
            '}': '\\}',
            '~': '\\textasciitilde{}',
            '^': '\\textasciicircum{}',
            '\\': '\\textbackslash{}',
        };
        return replacements[match];
    });
    return escaped.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');
});

const MIN_BULLETS = 2;

// Calculates and executes the lowest cost cut
function executeCheapestCut(data) {
    let moves = [];

    // Analyze scores of projects
    data.projects?.forEach((p, idx) => {
        if (p.bullets.length > MIN_BULLETS) {
            moves.push({
                type: 'trim_proj',
                idx,
                cost: p.bullets[p.bullets.length - 1].score,
                desc: `Trim '${p.title}' bullet #${p.bullets.length}`,
            });
        } else if (p.bullets.length === MIN_BULLETS) {
            moves.push({
                type: 'drop_proj',
                idx,
                cost: p.bullets.reduce((sum, b) => sum + b.score, 0),
                desc: `Drop '${p.title}' entirely`,
            });
        }
    });

    // Analyze scores of experience
    data.experience?.forEach((e, idx) => {
        if (e.bullets.length > MIN_BULLETS) {
            moves.push({
                type: 'trim_exp',
                idx,
                cost: e.bullets[e.bullets.length - 1].score,
                desc: `Trim '${e.company}' bullet #${e.bullets.length}`,
            });
        } else if (e.bullets.length === MIN_BULLETS) {
            moves.push({
                type: 'drop_exp',
                idx,
                cost: e.bullets.reduce((sum, b) => sum + b.score, 0) + 100,
                desc: `Drop '${e.company}' entirely`,
            });
        }
    });

    if (moves.length === 0) return false;

    // Sort by cost, execute the cheapest
    moves.sort((a, b) => a.cost - b.cost);
    const best = moves[0];

    console.log(`      Action: ${best.desc} (Cost: ${best.cost})`);

    if (best.type === 'trim_proj') data.projects[best.idx].bullets.pop();
    if (best.type === 'drop_proj') data.projects.splice(best.idx, 1);
    if (best.type === 'trim_exp') data.experience[best.idx].bullets.pop();
    if (best.type === 'drop_exp') data.experience.splice(best.idx, 1);

    return true;
}

// Generates the .tex, compiles it, and parses the stdout to check page count
async function generateAndMeasure(data, constraints, outputDir, fileName) {
    let texString = env.render('template1.tex', data);
    texString = texString.replace(
        /\\documentclass\[.*?\]\{article\}/,
        `\\documentclass[${constraints.fontSize || 11}pt]{article}`
    );

    const texPath = path.join(outputDir, `${fileName}.tex`);
    fs.writeFileSync(texPath, texString);

    let outputLog;
    try {
        const { stdout } = await execAsync(
            `pdflatex -interaction=nonstopmode -output-directory=${outputDir} ${texPath}`,
            { maxBuffer: 1024 * 1024 * 5 }
        );
        outputLog = stdout;
    } catch (e) {
        console.error("--- PDFLATEX CRASHED ---");
        console.error("Message:", e.message);
        outputLog = e.stdout || "";
    }

    const match = outputLog.match(/Output written on[\s\S]*?\(\s*(\d+)\s+page/i);

    if (match) {
        return parseInt(match[1], 10);
    }

    console.log('[Debug] Could not parse page count from pdflatex. Assuming 1.');
    return 1;
}

export const compileResume = async (applicationId, constraints, userScoredInventory) => {
    let data = JSON.parse(JSON.stringify(userScoredInventory));
    const minScore = constraints.minScore || 0;
    const maxPages = constraints.maxPages || 1;

    if (Array.isArray(data.skills)) {
        const formattedSkills = {};

        data.skills.forEach((skillDoc) => {
            // Use the category provided, fallback if blank
            const category = skillDoc.category || 'Other';
            const skillName = skillDoc.name;

            if (skillName) {
                // If this category doesn't exist yet in dictionary, create it
                if (!formattedSkills[category]) {
                    formattedSkills[category] = [];
                }
                // Push the skill name into the category's array
                formattedSkills[category].push(skillName);
            }
        });

        data.skills = formattedSkills;
    }

    console.log('--- Applying Score Constraints ---');
    ['experience', 'projects'].forEach((section) => {
        if (!data[section]) return;
        data[section].forEach((item) => {
            item.bullets = item.bullets
                .filter((b) => b.score >= minScore)
                .sort((a, b) => b.score - a.score);
        });
        data[section] = data[section].filter((item) => item.bullets.length >= MIN_BULLETS);
    });

    const outputDir = path.join(__dirname, '../public/pdfs');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const fileName = `resume_${applicationId}`;

    console.log('--- Page Fitting ---');

    // Initial compile and measure
    let pages = await generateAndMeasure(data, constraints, outputDir, fileName);

    let iteration = 0;
    while (pages > maxPages && iteration < 50) {
        console.log(`   Iteration ${iteration}: ${pages} pages. Calculating lowest cost cut...`);

        const canCut = executeCheapestCut(data);
        if (!canCut) {
            console.log('   WARNING: No valid moves left. Cannot shrink further.');
            break;
        }

        // Reccompile and measure after a cut
        pages = await generateAndMeasure(data, constraints, outputDir, fileName);
        iteration++;
    }

    console.log(`SUCCESS: Resume fits on ${pages} page(s).`);

    return {
        pdfUrl: `/pdfs/${fileName}.pdf`,
        snapshotData: data,
    };
};
