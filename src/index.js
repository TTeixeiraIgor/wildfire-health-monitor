import express from 'express';
import dotenv from 'dotenv';
import { fetchBrazilFires } from './firms-service.js';
import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/fires/brazil', async (req, res) => {
  try {
    const source = (req.query.source || 'modis').toLowerCase();
    const data = await fetchBrazilFires(source);
    res.json({ source, country: 'Brazil', count: data.length, fires: data });
  } catch (error) {
    console.error('Error fetching Brazil FIRMS data:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch fire data from FIRMS.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'wildfire-health-monitor-backend' });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Wildfire backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
