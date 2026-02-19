import express from "express";
import { ObjectId } from "mongodb";
import { getCollections } from "../db/mongo.js";
import crypto from "crypto";

const router = express.Router();

function normalizeBullets(bullets) {
  if (!Array.isArray(bullets)) return [];
  return bullets
    .filter((b) => b && typeof b.text === "string")
    .map((b) => ({
      id: typeof b.id === "string" && b.id.length ? b.id : crypto.randomUUID(),
      text: b.text.trim(),
    }))
    .filter((b) => b.text.length > 0);
}

/**
 * GET /api/experiences
 */
router.get("/", async (req, res) => {
  try {
    const { experiences } = getCollections();
    const data = await experiences.find({}).sort({ updatedAt: -1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch experiences" });
  }
});

/**
 * POST /api/experiences
 * body: { company, dates, role, location, bullets }
 */
router.post("/", async (req, res) => {
  try {
    const {
      company,
      dates = "",
      role = "",
      location = "",
      bullets = [],
    } = req.body ?? {};

    if (
      !company ||
      typeof company !== "string" ||
      company.trim().length === 0
    ) {
      return res.status(400).json({ error: "company is required" });
    }

    const doc = {
      company: company.trim(),
      dates: typeof dates === "string" ? dates.trim() : "",
      role: typeof role === "string" ? role.trim() : "",
      location: typeof location === "string" ? location.trim() : "",
      bullets: normalizeBullets(bullets),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { experiences } = getCollections();
    const result = await experiences.insertOne(doc);
    const created = await experiences.findOne({ _id: result.insertedId });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create experience" });
  }
});

/**
 * PUT /api/experiences/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });

    const {
      company,
      dates = "",
      role = "",
      location = "",
      bullets = [],
    } = req.body ?? {};

    if (
      !company ||
      typeof company !== "string" ||
      company.trim().length === 0
    ) {
      return res.status(400).json({ error: "company is required" });
    }

    const filter = { _id: new ObjectId(id) };
    const update = {
      $set: {
        company: company.trim(),
        dates: typeof dates === "string" ? dates.trim() : "",
        role: typeof role === "string" ? role.trim() : "",
        location: typeof location === "string" ? location.trim() : "",
        bullets: normalizeBullets(bullets),
        updatedAt: new Date(),
      },
    };

    const { experiences } = getCollections();
    const result = await experiences.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const updated = await experiences.findOne(filter);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update experience" });
  }
});

/**
 * DELETE /api/experiences/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });

    const { experiences } = getCollections();
    const result = await experiences.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Experience not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete experience" });
  }
});

export default router;
