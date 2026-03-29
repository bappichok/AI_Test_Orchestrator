import express from 'express';
import axios from 'axios';

const router = express.Router();

// POST /api/ado/fetch — fetch Azure DevOps Work Item by ID
router.post('/fetch', async (req, res) => {
  const { workItemId, org, project, token } = req.body;

  const adoOrg = org || process.env.ADO_ORG;
  const adoProject = project || process.env.ADO_PROJECT;
  const adoToken = token || process.env.ADO_TOKEN;

  if (!adoOrg || !adoToken || !workItemId) {
    return res.status(400).json({ error: 'ADO org, token, and workItemId are required.' });
  }

  try {
    const auth = Buffer.from(`:${adoToken}`).toString('base64');
    const url = `https://dev.azure.com/${adoOrg}/${adoProject ? adoProject + '/' : ''}_apis/wit/workitems/${workItemId}?api-version=7.0&$expand=all`;

    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    });

    const item = response.data;
    const fields = item.fields;

    const descHtml = fields['System.Description'] || '';
    const descText = stripHtml(descHtml).substring(0, 200);
    const acHtml = fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '';
    const acText = stripHtml(acHtml);
    const acLines = acText ? acText.split('\n').filter(l => l.trim()) : [];

    const flags = [];
    if (acLines.length === 0) flags.push('MISSING_AC');
    if (descText.split(' ').filter(w => w).length < 20) flags.push('VAGUE_DESC');

    const normalized = {
      id: `ADO-${workItemId}`,
      title: fields['System.Title'] || '',
      description: descText,
      acceptance_criteria: acLines,
      priority: normalizePriority(fields['Microsoft.VSTS.Common.Priority']),
      type: fields['System.WorkItemType'] || 'User Story',
      epic: fields['System.AreaPath'] || '',
      labels: fields['System.Tags'] ? fields['System.Tags'].split(';').map(t => t.trim()) : [],
      status: fields['System.State'] || '',
      assignee: fields['System.AssignedTo']?.displayName || 'Unassigned',
      reporter: fields['System.CreatedBy']?.displayName || '',
      flags
    };

    res.json({ success: true, story: normalized });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Invalid ADO credentials.' });
    if (status === 404) return res.status(404).json({ error: `Work item ${workItemId} not found.` });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ado/test — verify connectivity
router.post('/test', async (req, res) => {
  const { org, token } = req.body;
  const adoOrg = org || process.env.ADO_ORG;
  const adoToken = token || process.env.ADO_TOKEN;
  if (!adoOrg || !adoToken) return res.json({ connected: false, error: 'Missing credentials' });
  try {
    const auth = Buffer.from(`:${adoToken}`).toString('base64');
    await axios.get(`https://dev.azure.com/${adoOrg}/_apis/projects?api-version=7.0`, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    });
    res.json({ connected: true });
  } catch {
    res.json({ connected: false, error: 'Connection failed' });
  }
});

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizePriority(raw) {
  if (!raw) return 'Medium';
  const p = String(raw).toLowerCase();
  if (p === '1' || p.includes('critical')) return 'Critical';
  if (p === '2' || p.includes('high')) return 'High';
  if (p === '4' || p.includes('low')) return 'Low';
  return 'Medium';
}

export default router;
