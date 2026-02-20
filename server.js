import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
// Data based
import { connectToMongo } from "./src/db/mongo.js";
import { connectToDatabase } from './db/connection.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Router
import applicationsRouter from './routes/applications.js';
import snapshotsRouter from './routes/snapshots.js';
import inventoryRouter from './routes/inventory.js';
import scoreRouter from './routes/score.js';

import aboutRouter from "./src/routes/about.routes.js";
import educationRouter from "./src/routes/education.routes.js";
import skillsRouter from "./src/routes/skills.routes.js";
import projectsRouter from "./src/routes/projects.routes.js";
import experiencesRouter from "./src/routes/experiences.routes.js";
import myInventoryRouter from "./src/routes/inventory.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "resumatch";

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Mount routers
app.use('/api/applications', applicationsRouter);
app.use('/api/snapshots', snapshotsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/score', scoreRouter);

app.use("/api/about", aboutRouter);
app.use("/api/education", educationRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/experiences", experiencesRouter);
app.use("/api/my-inventory", myInventoryRouter);

// Boot data base and server
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment variables");
  process.exit(1);
}

await connectToMongo(MONGODB_URI, DB_NAME);
await connectToDatabase();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
