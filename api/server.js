import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
import jiraRouter from './routes/jira.js';
import adoRouter from './routes/ado.js';
import generateRouter from './routes/generate.js';
import connectionsRouter from './routes/connections.js';
import exportRouter from './routes/export.js';

app.use('/api/jira', jiraRouter);
app.use('/api/ado', adoRouter);
app.use('/api/generate', generateRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/export', exportRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 AI Test Orchestrator API running on http://127.0.0.1:${PORT}`);
  console.log(`   LLM Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
});

export default app;
