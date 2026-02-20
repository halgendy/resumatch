import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connection.js';
import { compileResume } from '../services/resumeCompiler.js';

const router = express.Router();

// mounted at root of /api/snapshots
// Snapshot storing resume PDF and info contained inside
router.post('/', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('generated_snapshots');

        const { applicationId, constraints, userScoredInventory } = req.body;

        if (!applicationId) {
            return res
                .status(400)
                .json({ error: 'applicationId is required to generate a resume.' });
        }

        // 2. Call your vanilla JS compiler logic
        const result = await compileResume(applicationId, constraints, userScoredInventory);

        // 3. Save the resulting data to the database
        const newSnapshot = {
            applicationId: ObjectId.createFromHexString(applicationId),
            selectedInventory: result.snapshotData,
            pdfPath: result.pdfUrl,
            createdAt: new Date(),
        };

        const dbResult = await collection.insertOne(newSnapshot);

        // 4. Return the path so the frontend can display it
        res.status(201).json({
            message: 'Resume generated successfully',
            id: dbResult.insertedId,
            pdfUrl: result.pdfUrl,
        });
    } catch (error) {
        console.error('Error generating snapshot:', error);
        res.status(500).json({ error: 'Failed to generate resume snapshot' });
    }
});

// Get snapshots
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('generated_snapshots');

        // Cool part is we can filter a result tied to ID
        // Or get all snapshots ever optional ID not there
        let query = {};
        if (req.query.applicationId) {
            query.applicationId = ObjectId.createFromHexString(req.query.applicationId);
        }

        const snapshots = await collection.find(query).toArray();
        res.status(200).json(snapshots);
    } catch (error) {
        console.error('Error fetching snapshots:', error);
        res.status(500).json({ error: 'Failed to fetch snapshots' });
    }
});

// Update a snapshot like for new compiled PDF for the application
router.patch('/:id', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('generated_snapshots');

        const query = { _id: ObjectId.createFromHexString(req.params.id) };
        const updates = { $set: req.body };

        const result = await collection.updateOne(query, updates);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Snapshot not found' });
        }
        res.status(200).json({ message: 'Snapshot updated successfully' });
    } catch (error) {
        console.error('Error updating snapshot:', error);
        res.status(500).json({ error: 'Failed to update snapshot' });
    }
});

// Delete a snapshot like if an application gets deleted
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection('generated_snapshots');

        const query = { _id: ObjectId.createFromHexString(req.params.id) };
        const result = await collection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Snapshot not found' });
        }
        res.status(200).json({ message: 'Snapshot deleted successfully' });
    } catch (error) {
        console.error('Error deleting snapshot:', error);
        res.status(500).json({ error: 'Failed to delete snapshot' });
    }
});

export default router;
