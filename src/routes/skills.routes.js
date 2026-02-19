import express from "express";
import { ObjectId } from "mongodb";
import { getCollections } from "../db/mongo.js";

const router = express.Router();

/**
 * GET all skills
 */
router.get("/", async (req, res) => {
  try {
    const { skills } = getCollections();
    const data = await skills.find({}).sort({ createdAt: -1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

/**
 * POST create skill
 */
router.post("/", async (req, res) => {
  try {
    const { name, category = "" } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const newSkill = {
      name: name.trim(),
      category: category.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { skills } = getCollections();
    const result = await skills.insertOne(newSkill);

    res.status(201).json({
      _id: result.insertedId,
      ...newSkill,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create skill" });
  }
});

/**
 * PUT update skill
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category = "" } = req.body ?? {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const { skills } = getCollections();

    const filter = { _id: new ObjectId(id) };
    const update = {
      $set: {
        name: name.trim(),
        category: typeof category === "string" ? category.trim() : "",
        updatedAt: new Date(),
      },
    };

    const result = await skills.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    const updated = await skills.findOne(filter);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update skill" });
  }
});

/**
 * DELETE skill
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { skills } = getCollections();
    const result = await skills.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});

export default router;
