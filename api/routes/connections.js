import express from 'express';
import axios from 'axios';

const router = express.Router();

// POST /api/connections/test — generic connection test dispatcher
router.post('/test', async (req, res) => {
  const { type, config } = req.body;
  // Dispatcher to appropriate test endpoint
  try {
    if (type === 'jira') {
      if (!config.baseUrl || !config.email || !config.apiToken) throw new Error('Missing Jira Base URL, Email, or API Token');
      const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
      await axios.get(`${config.baseUrl.replace(/\/$/, '')}/rest/api/3/myself`, {
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
      });
    } else if (type === 'ado') {
      if (!config.org || !config.project || !config.token) throw new Error('Missing Azure Organization, Project, or PAT Token');
      const auth = Buffer.from(`:${config.token}`).toString('base64');
      await axios.get(`https://dev.azure.com/${config.org}/_apis/projects?api-version=7.0`, {
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
        maxRedirects: 0
      });
    } else if (type === 'llm') {
      const { routeToLLM } = await import('../services/aiOrchestrator.js');
      // Perform a minimal check call to ensure the model and API key are valid
      await routeToLLM("You are a tester.", "Respond with OK.", {
        llmProvider: config.provider,
        apiKey: config.apiKey,
        groqModel: config.groqModel,
        ollamaModel: config.ollamaModel,
        geminiModel: config.geminiModel,
        customModel: config.customModel,
        customUrl: config.customUrl,
        ollamaUrl: config.ollamaUrl
      });
    } else {
      return res.status(400).json({ connected: false, error: 'Unknown integration type' });
    }
    res.json({ connected: true });
  } catch (err) {
    res.json({ connected: false, error: err.response?.data?.error?.message || err.response?.data?.message || err.message });
  }
});

export default router;
