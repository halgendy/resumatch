import express from 'express';
import { scoreInventory } from '../services/resumeScorer.js';
import { mockInventory } from '../services/mockData.js';

const router = express.Router();

// mounted at root of /api/score
router.post('/', (req, res) => {
    const { jobDescription } = req.body;
    
    if (!jobDescription) {
        return res.status(400).json({ error: "Job description is required for scoring" });
    }

    try {
        const scoredData = scoreInventory(mockInventory, jobDescription);
        res.status(200).json(scoredData);
    } catch (error) {
        console.error("Scoring error:", error);
        res.status(500).json({ error: "Failed to score inventory" });
    }
});

export default router;