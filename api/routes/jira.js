import express from 'express';
import axios from 'axios';

const router = express.Router();

// POST /api/jira/fetch  — fetch by issue ID, using runtime credentials from body OR env
router.post('/fetch', async (req, res) => {
  const {
    issueId,
    baseUrl,
    email,
    apiToken
  } = req.body;

  const jiraBase = baseUrl || process.env.JIRA_BASE_URL;
  const jiraEmail = email || process.env.JIRA_EMAIL;
  const jiraToken = apiToken || process.env.JIRA_API_TOKEN;

  if (!jiraBase || !jiraEmail || !jiraToken) {
    return res.status(400).json({ error: 'Jira credentials are required. Set them in .env or pass in the request body.' });
  }

  if (!issueId) {
    return res.status(400).json({ error: 'issueId is required.' });
  }

  try {
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    const url = `${jiraBase.replace(/\/$/, '')}/rest/api/3/issue/${issueId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json'
      }
    });

    const issue = response.data;
    const fields = issue.fields;

    // Extract acceptance criteria from description (common location in Jira)
    const descDoc = fields.description;
    const descText = extractTextFromADF(descDoc);
    const acText = extractAcceptanceCriteria(descDoc, fields.customfield_10016);

    const flags = [];
    if (!acText || acText.length === 0) flags.push('MISSING_AC');
    if (descText && descText.split(' ').filter(w => w).length < 20) flags.push('VAGUE_DESC');

    const normalized = {
      id: issue.key,
      title: fields.summary || '',
      description: (descText || '').substring(0, 200),
      acceptance_criteria: acText || [],
      priority: normalizePriority(fields.priority?.name),
      type: fields.issuetype?.name || 'Story',
      epic: fields.epic?.name || fields.customfield_10014 || '',
      labels: fields.labels || [],
      status: fields.status?.name || '',
      assignee: fields.assignee?.displayName || 'Unassigned',
      reporter: fields.reporter?.displayName || '',
      flags
    };

    res.json({ success: true, story: normalized });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Invalid Jira credentials.' });
    if (status === 404) return res.status(404).json({ error: `Issue ${issueId} not found.` });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jira/test — verify connectivity
router.post('/test', async (req, res) => {
  const { baseUrl, email, apiToken } = req.body;
  const jiraBase = baseUrl || process.env.JIRA_BASE_URL;
  const jiraEmail = email || process.env.JIRA_EMAIL;
  const jiraToken = apiToken || process.env.JIRA_API_TOKEN;

  if (!jiraBase || !jiraEmail || !jiraToken) {
    return res.json({ connected: false, error: 'Missing credentials' });
  }

  try {
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    await axios.get(`${jiraBase.replace(/\/$/, '')}/rest/api/3/myself`, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    });
    res.json({ connected: true });
  } catch {
    res.json({ connected: false, error: 'Connection failed' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────
function extractTextFromADF(doc) {
  if (!doc || typeof doc !== 'object') return doc || '';
  const texts = [];
  function walk(node) {
    if (!node) return;
    if (node.type === 'text') texts.push(node.text || '');
    if (node.content) node.content.forEach(walk);
  }
  walk(doc);
  return texts.join(' ').trim();
}

function extractAcceptanceCriteria(descDoc, customAC) {
  if (customAC) {
    if (Array.isArray(customAC)) return customAC;
    if (typeof customAC === 'string') return customAC.split('\n').filter(l => l.trim());
  }
  // Try to find "Acceptance Criteria" section in ADF description
  if (!descDoc || descDoc.type !== 'doc') return [];
  const lines = [];
  let inAC = false;
  for (const node of (descDoc.content || [])) {
    const text = extractTextFromADF(node);
    if (/acceptance criteria/i.test(text)) { inAC = true; continue; }
    if (inAC && text.trim()) {
      if (/^(definition of done|out of scope|notes?|assumptions?)/i.test(text)) break;
      lines.push(text.trim());
    }
  }
  return lines;
}

function normalizePriority(raw) {
  if (!raw) return 'Medium';
  const p = raw.toLowerCase();
  if (p.includes('critical') || p.includes('blocker')) return 'Critical';
  if (p.includes('high') || p.includes('major')) return 'High';
  if (p.includes('low') || p.includes('minor') || p.includes('trivial')) return 'Low';
  return 'Medium';
}

export default router;
