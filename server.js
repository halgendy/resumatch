import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Data based
import { connectToDatabase } from './db/connection.js';

// Router
import applicationsRouter from './routes/applications.js';
import snapshotsRouter from './routes/snapshots.js';
import inventoryRouter from './routes/inventory.js';
import scoreRouter from './routes/score.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Mount routers
app.use('/api/applications', applicationsRouter);
app.use('/api/snapshots', snapshotsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/score', scoreRouter);

// Boot data base and server
await connectToDatabase();
app.listen(PORT, () => {
    console.log(`ResuMatch listening on port ${PORT}`);
});