document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('grid-container');

    try {
        const response = await fetch('/api/applications');
        const applications = await response.json();

        // Make links to pages of each job app
        applications.forEach(app => {
            const link = document.createElement('a');
            link.href = `/editor?id=${app._id}`;
            link.className = 'card';
            link.innerHTML = `
                <h3>${app.company}</h3>
                <p>${app.jobTitle}</p>
            `;
            gridContainer.appendChild(link);
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
});