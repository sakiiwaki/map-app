import express from 'express';
import cors from 'cors';
import { config } from './config';
import { placesRouter } from './routes/places';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/places', placesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(config.port, () => {
  console.log(`MCP Server listening on port ${config.port}`);
});
