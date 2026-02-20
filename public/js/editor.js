document.addEventListener('DOMContentLoaded', async () => {
    const appId = new URLSearchParams(window.location.search).get('id');
    const form = document.getElementById('app-form');
    const scoringContainer = document.getElementById('scoring-container');
    let currentInventory = null;

    // If URL has id for existing application (not new)
    if (appId) {
        document.getElementById('page-title').textContent = 'Edit Application';
        document.getElementById('delete-btn').classList.remove('hidden');
        document.getElementById('generate-btn').classList.remove('hidden');

        // Fetch application's data
        const apps = await (await fetch('/api/applications')).json();
        const app = apps.find((a) => a._id === appId);
        if (!app) return alert('Application not found');

        // Add existing data to form
        const jobDetails = ['jobTitle', 'company', 'jobDescription'];
        jobDetails.forEach((f) => (document.getElementById(f).value = app[f] || ''));
        document.getElementById('maxPages').value = app.constraints?.maxPages || 1;
        document.getElementById('fontSize').value = app.constraints?.fontSize || 11;

        currentInventory = app.inventory || (await (await fetch('/api/inventory')).json());

        // Load in last compiled PDF if found
        const snaps = await (await fetch(`/api/snapshots?applicationId=${appId}`)).json();
        if (snaps.length) showPdf(snaps[snaps.length - 1].pdfPath);
    } else {
        currentInventory = await (await fetch('/api/inventory')).json();
    }

    renderScoringUI(currentInventory);

    // // // HELPER METHODS // // //

    // Show compiled PDF in pdf frame
    function showPdf(url) {
        const frame = document.getElementById('pdf-frame');
        frame.src = url;
        frame.classList.add('active');
        document.getElementById('pdf-placeholder').style.display = 'none';
    }

    // Create the section that shows / lets user score bullets
    function renderScoringUI(inv) {
        scoringContainer.innerHTML = '';
        const sections = ['experience', 'projects'];

        sections.forEach((type) => {
            if (!inv[type]) return;
            scoringContainer.innerHTML += `<h4 class="section-subtitle">${type.toUpperCase()}</h4>`;

            inv[type].forEach((item, iIdx) => {
                scoringContainer.innerHTML += `<strong>${item.company || item.title}</strong>`;
                item.bullets.forEach((b, bIdx) => {
                    scoringContainer.innerHTML += `
                        <div class="score-item">
                            <input type="number" class="score-input" data-type="${type}" data-item="${iIdx}" data-bullet="${bIdx}" value="${b.score}" min="0" max="100">
                            <p class="score-text">${b.text}</p>
                        </div>`;
                });
            });
        });
    }

    // Get the information from all form fields to send
    function getPayload() {
        document.querySelectorAll('.score-input').forEach((input) => {
            const { type, item, bullet } = input.dataset;
            currentInventory[type][item].bullets[bullet].score = parseInt(input.value);
        });
        const fd = new FormData(form);
        return {
            jobTitle: fd.get('jobTitle'),
            company: fd.get('company'),
            jobDescription: fd.get('jobDescription'),
            constraints: {
                maxPages: parseInt(fd.get('maxPages')),
                fontSize: parseInt(fd.get('fontSize')),
            },
            inventory: currentInventory,
        };
    }

    // // // EVENT HANDLERS // // //

    // Save all application information / configuration
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // If no appId, create first time otherwise update / patch
        const res = await fetch(appId ? `/api/applications/${appId}` : '/api/applications', {
            method: appId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getPayload()),
        });

        // After submit, not a new application anymore, add id to url
        if (res.ok) {
            if (!appId) window.location.href = `/editor?id=${(await res.json()).id}`;
            else alert('Application Saved!');
        }
    });

    // Generate PDF for application
    document.getElementById('generate-btn').addEventListener('click', async (_e) => {
        const payload = getPayload();

        const res = await fetch('/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                applicationId: appId,
                constraints: payload.constraints,
                userScoredInventory: payload.inventory,
            }),
        });

        if (res.ok) showPdf((await res.json()).pdfUrl);
        else alert('Latex Compilation Failed');
    });

    // Score application bullets with algorithm
    document.getElementById('score-btn').addEventListener('click', async (_e) => {
        const jobDescription = document.getElementById('jobDescription').value;
        if (!jobDescription) return alert('Enter Job Description to score');

        currentInventory = await (
            await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobDescription: jobDescription }),
            })
        ).json();

        renderScoringUI(currentInventory);
    });

    // Delete whole application
    document.getElementById('delete-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this application?')) {
            await fetch(`/api/applications/${appId}`, { method: 'DELETE' });

            // Leave to dashboard, page deleted
            window.location.href = '/';
        }
    });
});
