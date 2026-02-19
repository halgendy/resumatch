import fs from 'fs';
import path from 'path';
import latex from 'node-latex';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function applyConstraints(inventory, constraints) {
    if (!inventory) {
        throw new Error("Missing inventory data for compilation.");
    }

    // Deep copy to avoid mutating the original data
    const tailored = JSON.parse(JSON.stringify(inventory));
    const minScore = constraints.minScore || 40;

    // Filter experience bullets, ignore jobs with 0 bullets left
    tailored.experience.forEach(job => {
        job.bullets = job.bullets
            .filter(b => b.score >= minScore)
            .sort((a, b) => b.score - a.score);
    });
    tailored.experience = tailored.experience.filter(job => job.bullets.length > 0);

    // Filter project bullets, ignore projects with 0 bullets left
    tailored.projects.forEach(proj => {
        proj.bullets = proj.bullets
            .filter(b => b.score >= minScore)
            .sort((a, b) => b.score - a.score);
    });
    tailored.projects = tailored.projects.filter(proj => proj.bullets.length > 0);

    return tailored;
}

// Add slash / escape for special characters
const escapeLatex = (str) => {
    if (!str) return '';
    return String(str).replace(/[&%$#_{}~^\\]/g, (match) => `\\${match}`);
};

export const compileResume = (applicationId, constraints, userScoredInventory) => {
    return new Promise((resolve, reject) => {
        const tailoredData = applyConstraints(userScoredInventory, constraints);

        // Just read .tex template as just normal file
        const templatePath = path.join(__dirname, '../templates/basic.tex');
        let texString = fs.readFileSync(templatePath, 'utf8');

        // Make latex for experience section (project, bullets)
        const experienceLatex = tailoredData.experience.map(job => `
            \\noindent \\textbf{${escapeLatex(job.company)}} \\hfill \\textbf{${escapeLatex(job.dates)}} \\par
            \\noindent \\textit{${escapeLatex(job.role)}} \\hfill \\textit{${escapeLatex(job.location)}} \\par
            \\begin{itemize}
            ${job.bullets.map(b => `\\item ${escapeLatex(b.text)}`).join('\n')}
            \\end{itemize}
            \\vspace{4pt}
        `).join('\n');

        // Make latex for project section (project, bullets)
        const projectsLatex = tailoredData.projects.map(proj => `
            \\noindent \\textbf{${escapeLatex(proj.title)}} \\hfill \\textbf{${escapeLatex(proj.dates)}} \\par
            \\noindent \\textit{${escapeLatex(proj.role)}} \\par
            \\begin{itemize}
            ${proj.bullets.map(b => `\\item ${escapeLatex(b.text)}`).join('\n')}
            \\end{itemize}
            \\vspace{4pt}
        `).join('\n');

        // Swap in latex template placeholders for tailored values
        texString = texString
            .replace('___ABOUT_NAME___', escapeLatex(tailoredData.about.name))
            .replace('___ABOUT_EMAIL___', escapeLatex(tailoredData.about.email))
            .replace('___ABOUT_PHONE___', escapeLatex(tailoredData.about.phone))
            .replace('___ABOUT_LOCATION___', escapeLatex(tailoredData.about.location))
            .replace('___EXPERIENCE_LIST___', experienceLatex)
            .replace('___PROJECTS_LIST___', projectsLatex);

        // Setup file path for the final PDF
        const outputDir = path.join(__dirname, '../public/pdfs');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        // ID to identify PDF for application later
        const fileName = `resume_${applicationId}.pdf`;
        const pdfPath = path.join(outputDir, fileName);

        // node-latex library just to compile / save PDF
        const output = fs.createWriteStream(pdfPath);
        const pdf = latex(texString);

        pdf.pipe(output);

        pdf.on('error', err => {
            console.error('LaTeX compilation error:', err);
            reject(err);
        });

        pdf.on('finish', () => {
            resolve({
                pdfUrl: `/pdfs/${fileName}`,
                snapshotData: tailoredData
            });
        });
    });
};