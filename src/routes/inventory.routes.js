import express from "express";
import { getCollections } from "../db/mongo.js";

const router = express.Router();
const ABOUT_KEY = "singleton";

/**
 * GET /api/inventory
 * Returns a single object matching Hazem's expected mockInventory format:
 * { about, education, experience, projects }
 */
router.get("/", async (req, res) => {
  try {
    const { about, education, experiences, projects, skills } =
      getCollections();

    const aboutDoc = await about.findOne({ key: ABOUT_KEY });
    const eduDocs = await education.find({}).sort({ updatedAt: -1 }).toArray();
    const expDocs = await experiences
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();
    const projDocs = await projects.find({}).sort({ updatedAt: -1 }).toArray();
    const skillDocs = await skills.find({}).sort({ updatedAt: -1 }).toArray();

    // remove internal fields if you want (optional)
    const aboutOut = aboutDoc
      ? (() => {
          const { key, _id, createdAt, updatedAt, ...rest } = aboutDoc;
          return rest;
        })()
      : null;

    const educationOut = eduDocs.map(
      ({ _id, createdAt, updatedAt, ...rest }) => rest,
    );
    const experienceOut = expDocs.map(
      ({ _id, createdAt, updatedAt, ...rest }) => rest,
    );
    const projectsOut = projDocs.map(
      ({ _id, createdAt, updatedAt, ...rest }) => rest,
    );
    const skillsOut = skillDocs.map(
      ({ _id, createdAt, updatedAt, ...rest }) => rest,
    );

    res.json({
      about: aboutOut,
      education: educationOut,
      experience: experienceOut, // Hazem uses "experience" singular key (array)
      projects: projectsOut,
      skills: skillsOut,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

export default router;
