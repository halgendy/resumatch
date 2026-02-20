import express from 'express';
import { getCollections } from '../db/connection.js';

const router = express.Router();

/**
 * We store exactly ONE about document.
 * We'll use a fixed key so we can upsert easily.
 */
const ABOUT_KEY = 'singleton';

/**
 * GET /api/about
 * Returns about object or null if not set yet.
 */
router.get('/', async (_req, res) => {
    try {
        const { about } = getCollections();
        const doc = await about.findOne({ key: ABOUT_KEY });
        if (!doc) return res.json(null);

        // hide internal key
        const { key, ...rest } = doc;
        res.json(rest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch about' });
    }
});

/**
 * PUT /api/about (upsert)
 * body: { name, phone, email, location, availability, links: { website, linkedin, github } }
 */
router.put('/', async (req, res) => {
    try {
        const body = req.body ?? {};

        const doc = {
            key: ABOUT_KEY,
            name: typeof body.name === 'string' ? body.name.trim() : '',
            phone: typeof body.phone === 'string' ? body.phone.trim() : '',
            email: typeof body.email === 'string' ? body.email.trim() : '',
            location: typeof body.location === 'string' ? body.location.trim() : '',
            availability: typeof body.availability === 'string' ? body.availability.trim() : '',
            links: {
                website: {
                    display:
                        typeof body?.links?.website?.display === 'string'
                            ? body.links.website.display.trim()
                            : '',
                    url:
                        typeof body?.links?.website?.url === 'string'
                            ? body.links.website.url.trim()
                            : '',
                },
                linkedin: {
                    display:
                        typeof body?.links?.linkedin?.display === 'string'
                            ? body.links.linkedin.display.trim()
                            : '',
                    url:
                        typeof body?.links?.linkedin?.url === 'string'
                            ? body.links.linkedin.url.trim()
                            : '',
                },
                github: {
                    display:
                        typeof body?.links?.github?.display === 'string'
                            ? body.links.github.display.trim()
                            : '',
                    url:
                        typeof body?.links?.github?.url === 'string'
                            ? body.links.github.url.trim()
                            : '',
                },
            },
            updatedAt: new Date(),
        };

        const { about } = getCollections();

        await about.updateOne(
            { key: ABOUT_KEY },
            {
                $set: doc,
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        const saved = await about.findOne({ key: ABOUT_KEY });
        const { key, ...rest } = saved;
        res.json(rest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save about' });
    }
});

export default router;
