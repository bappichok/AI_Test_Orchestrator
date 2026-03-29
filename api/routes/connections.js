import express from 'express';
import axios from 'axios';

const router = express.Router();

// POST /api/connections/test — generic connection test dispatcher
router.post('/test', async (req, res) => {
  const { type, config } = req.body;
  // Dispatcher to appropriate test endpoint
  try {
    if (type === 'jira') {
      const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
      await axios.get(`${config.baseUrl.replace(/\/$/, '')}/rest/api/3/myself`, {
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
      });
    } else if (type === 'ado') {
      const auth = Buffer.from(`:${config.token}`).toString('base64');
      await axios.get(`https://dev.azure.com/${config.org}/_apis/projects?api-version=7.0`, {
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
      });
    } else {
      return res.status(400).json({ connected: false, error: 'Unknown integration type' });
    }
    res.json({ connected: true });
  } catch (err) {
    res.json({ connected: false, error: err.response?.data?.message || err.message });
  }
});

export default router;
