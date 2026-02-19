import express from "express";
import { ObjectId } from "mongodb";
import { getCollections } from "../db/mongo.js";
import crypto from "crypto";

const router = express.Router();

/**
 * Normalize bullets to:
 * [{ id: string, text: string }]
 */
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
 * Normalize tech_stack to:
 * ["Python", "MongoDB", ...] (unique-ish, trimmed)
 */
function normalizeTechStack(techStack) {
  if (!Array.isArray(techStack)) return [];
  const cleaned = techStack
    .filter((s) => typeof s === "string")
    .map((s) => s.trim())
    .filter(Boolean);

  // de-dupe (case-insensitive) while preserving original casing of first occurrence
  const seen = new Set();
  const out = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * GET /api/projects
 */
router.get("/", async (req, res) => {
  try {
    const { projects } = getCollections();
    const data = await projects.find({}).sort({ updatedAt: -1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/**
 * POST /api/projects
 * body: { title, dates, role, tech_stack: [string], bullets: [{id?, text}] }
 */
router.post("/", async (req, res) => {
  try {
    const {
      title,
      dates = "",
      role = "",
      tech_stack = [],
      bullets = [],
    } = req.body ?? {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required" });
    }

    const doc = {
      title: title.trim(),
      dates: typeof dates === "string" ? dates.trim() : "",
      role: typeof role === "string" ? role.trim() : "",
      tech_stack: normalizeTechStack(tech_stack),
      bullets: normalizeBullets(bullets),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { projects } = getCollections();
    const result = await projects.insertOne(doc);
    const created = await projects.findOne({ _id: result.insertedId });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * PUT /api/projects/:id
 * body: { title, dates, role, tech_stack, bullets }
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const {
      title,
      dates = "",
      role = "",
      tech_stack = [],
      bullets = [],
    } = req.body ?? {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required" });
    }

    const filter = { _id: new ObjectId(id) };
    const update = {
      $set: {
        title: title.trim(),
        dates: typeof dates === "string" ? dates.trim() : "",
        role: typeof role === "string" ? role.trim() : "",
        tech_stack: normalizeTechStack(tech_stack),
        bullets: normalizeBullets(bullets),
        updatedAt: new Date(),
      },
    };

    const { projects } = getCollections();
    const result = await projects.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updated = await projects.findOne(filter);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

/**
 * DELETE /api/projects/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { projects } = getCollections();
    const result = await projects.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
