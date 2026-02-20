import express from 'express';
import { scoreInventory } from '../services/resumeScorer.js';
import { getDb } from '../db/connection.js';

const router = express.Router();
const ABOUT_KEY = 'singleton';

// mounted at root of /api/score
router.post('/', async (req, res) => {
    const { jobDescription } = req.body;

    if (!jobDescription) {
        return res.status(400).json({ error: 'Job description is required for scoring' });
    }

    try {
        const db = getDb();

        // Fetch all documents from the database
        const aboutDoc = await db.collection('about').findOne({ key: ABOUT_KEY });
        const eduDocs = await db.collection('education').find({}).sort({ updatedAt: -1 }).toArray();
        const expDocs = await db
            .collection('experiences')
            .find({})
            .sort({ updatedAt: -1 })
            .toArray();
        const projDocs = await db.collection('projects').find({}).sort({ updatedAt: -1 }).toArray();
        const skillDocs = await db.collection('skills').find({}).sort({ updatedAt: -1 }).toArray();

        // Strip out internal database fields
        const aboutOut = aboutDoc
            ? (() => {
                  const { key, _id, createdAt, updatedAt, ...rest } = aboutDoc;
                  return rest;
              })()
            : null;

        const educationOut = eduDocs.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
        const experienceOut = expDocs.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
        const projectsOut = projDocs.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
        const skillsOut = skillDocs.map(({ _id, createdAt, updatedAt, ...rest }) => rest);

        // Assemble the dynamic master inventory
        const dynamicInventory = {
            about: aboutOut,
            education: educationOut,
            experience: experienceOut,
            projects: projectsOut,
            skills: skillsOut,
        };

        // Score the dynamic database inventory
        const scoredData = scoreInventory(dynamicInventory, jobDescription);

        res.status(200).json(scoredData);
    } catch (error) {
        console.error('Scoring error:', error);
        res.status(500).json({ error: 'Failed to score inventory' });
    }
});

export default router;
