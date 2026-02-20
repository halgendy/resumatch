import express from "express";
import { ObjectId } from "mongodb";
import { getCollections } from "../db/connection.js";

const router = express.Router();

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * GET /api/education
 */
router.get("/", async (req, res) => {
  try {
    const { education } = getCollections();
    const data = await education.find({}).sort({ updatedAt: -1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch education" });
  }
});

/**
 * POST /api/education
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body ?? {};

    const school = typeof body.school === "string" ? body.school.trim() : "";
    if (!school) return res.status(400).json({ error: "school is required" });

    const doc = {
      school,
      location: typeof body.location === "string" ? body.location.trim() : "",
      dates: typeof body.dates === "string" ? body.dates.trim() : "",
      degree: typeof body.degree === "string" ? body.degree.trim() : "",
      gpa: typeof body.gpa === "string" ? body.gpa.trim() : "",
      activities: normalizeStringArray(body.activities),
      coursework: normalizeStringArray(body.coursework),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { education } = getCollections();
    const result = await education.insertOne(doc);
    const created = await education.findOne({ _id: result.insertedId });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create education" });
  }
});

/**
 * PUT /api/education/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });

    const body = req.body ?? {};
    const school = typeof body.school === "string" ? body.school.trim() : "";
    if (!school) return res.status(400).json({ error: "school is required" });

    const filter = { _id: new ObjectId(id) };
    const update = {
      $set: {
        school,
        location: typeof body.location === "string" ? body.location.trim() : "",
        dates: typeof body.dates === "string" ? body.dates.trim() : "",
        degree: typeof body.degree === "string" ? body.degree.trim() : "",
        gpa: typeof body.gpa === "string" ? body.gpa.trim() : "",
        activities: normalizeStringArray(body.activities),
        coursework: normalizeStringArray(body.coursework),
        updatedAt: new Date(),
      },
    };

    const { education } = getCollections();
    const result = await education.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Education not found" });
    }

    const updated = await education.findOne(filter);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update education" });
  }
});

/**
 * DELETE /api/education/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });

    const { education } = getCollections();
    const result = await education.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Education not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete education" });
  }
});

export default router;