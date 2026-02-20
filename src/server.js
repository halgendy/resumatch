import express from "express";
import dotenv from "dotenv";

import aboutRouter from "./routes/about.routes.js";
import educationRouter from "./routes/education.routes.js";
import skillsRouter from "./routes/skills.routes.js";
import projectsRouter from "./routes/projects.routes.js";
import experiencesRouter from "./routes/experiences.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";

import { connectToMongo } from "./db/mongo.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/about", aboutRouter);
app.use("/api/education", educationRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/experiences", experiencesRouter);
app.use("/api/inventory", inventoryRouter);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "resumatch";

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment variables");
  process.exit(1);
}

await connectToMongo(MONGODB_URI, DB_NAME);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
