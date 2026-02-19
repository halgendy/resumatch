import express from 'express';
import { mockInventory } from '../services/mockData.js';

const router = express.Router();

// mounted at root of /api/inventory
router.get('/', (_req, res) => {
    const copyInventory = JSON.parse(JSON.stringify(mockInventory));
    
    // Init bullet scores 0 as default
    copyInventory.experience.forEach(j => j.bullets.forEach(b => b.score = b.score || 0));
    copyInventory.projects.forEach(p => p.bullets.forEach(b => b.score = b.score || 0));
    
    res.status(200).json(copyInventory);
});

export default router;