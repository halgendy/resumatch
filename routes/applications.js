import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connection.js';

const router = express.Router();

// Mounted at root of /api/applications
// Create a new application
router.post('/', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('applications');

        // Format the client's form post request data to be stored
        const newApplication = {
            jobTitle: req.body.jobTitle,
            company: req.body.company,
            jobDescription: req.body.jobDescription,
            constraints: req.body.constraints || { maxPages: 1 },
            inventory: req.body.inventory,
            createdAt: new Date(),
        };

        const result = await collection.insertOne(newApplication);
        res.status(201).json({ message: 'Application created', id: result.insertedId });
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// Read / get all applications
router.get('/', async (_req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('applications');

        // Cursor from find(), so cast to array
        const applications = await collection.find({}).toArray();
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Update information (job info, pdf constraints, etc) on a given application
router.patch('/:id', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('applications');

        const query = { _id: ObjectId.createFromHexString(req.params.id) };
        // $set so updates only what changed,
        // Thanks Mongo, you can infer to keep rest
        const updates = { $set: req.body };

        const result = await collection.updateOne(query, updates);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.status(200).json({ message: 'Application updated successfully' });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// Delete a given application
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('applications');

        // Get to use id from URL, only one PK
        const query = { _id: ObjectId.createFromHexString(req.params.id) };
        const result = await collection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.status(200).json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

export default router;
