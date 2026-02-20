const ignoreWords = new Set([
    'this',
    'that',
    'with',
    'from',
    'your',
    'have',
    'more',
    'will',
    'team',
    'about',
    'work',
]);

export const scoreInventory = (inventory, jobDescription) => {
    // Job description keywords (not in ignore list and > 3 letters)
    const jobKeywords = (jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(
        (w) => !ignoreWords.has(w)
    );

    // Function per bullet to check matching score of whole text
    const scoreText = (text) => {
        if (!text) return 0;

        // Same regex as job description
        const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        let matchCount = 0;

        words.forEach((w) => {
            if (jobKeywords.includes(w)) matchCount++;
        });

        // 20 points every keyword match with max 100
        return Math.min(100, matchCount * 20);
    };

    const scoredInventory = JSON.parse(JSON.stringify(inventory));

    // Save scores of experience bullets
    scoredInventory.experience.forEach((job) => {
        job.bullets.forEach((b) => {
            b.score = scoreText(b.text);
        });
    });

    // Save scores of project bullets
    scoredInventory.projects.forEach((proj) => {
        proj.bullets.forEach((b) => {
            b.score = scoreText(b.text);
        });
    });

    return scoredInventory;
};
