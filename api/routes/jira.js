import express from 'express';
import axios from 'axios';
import { resolveJiraCredentials } from '../utils/credentialHandler.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

const router = express.Router();

// POST /api/jira/fetch  — fetch by issue ID
router.post('/fetch', async (req, res) => {
  const { issueId } = req.body;
  const { baseUrl, email, apiToken } = resolveJiraCredentials(req.body);

  if (!baseUrl || !email || !apiToken) {
    return errorResponse(res, 'Jira credentials are required. Set them in .env or pass in the request body.', 400);
  }

  if (!issueId) {
    return errorResponse(res, 'issueId is required.', 400);
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/issue/${issueId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json'
      }
    });

    const issue = response.data;
    const fields = issue.fields;

    // Extract acceptance criteria from description
    const descDoc = fields.description;
    const descText = extractTextFromADF(descDoc);
    const acText = extractAcceptanceCriteria(descDoc, fields.customfield_10016);

    // Extract attachments
    const attachments = (fields.attachment || []).map(att => ({
      name: att.filename,
      url: att.content,
      mimeType: att.mimeType,
      size: att.size
    }));

    const flags = [];
    if (!acText || acText.length === 0) flags.push('MISSING_AC');
    if (descText && descText.split(' ').filter(w => w).length < 20) flags.push('VAGUE_DESC');

    const normalized = {
      id: issue.key,
      title: fields.summary || '',
      description: descText || '',
      acceptance_criteria: acText || [],
      attachments: attachments,
      priority: normalizePriority(fields.priority?.name),
      type: fields.issuetype?.name || 'Story',
      epic: fields.epic?.name || fields.customfield_10014 || '',
      labels: fields.labels || [],
      status: fields.status?.name || '',
      assignee: fields.assignee?.displayName || 'Unassigned',
      reporter: fields.reporter?.displayName || '',
      flags
    };

    successResponse(res, { story: normalized });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return errorResponse(res, 'Invalid Jira credentials.', 401);
    if (status === 404) return errorResponse(res, `Issue ${issueId} not found.`, 404);
    errorResponse(res, err.message, 500, err);
  }
});

// POST /api/jira/test — verify connectivity
router.post('/test', async (req, res) => {
  const { baseUrl, email, apiToken } = resolveJiraCredentials(req.body);

  if (!baseUrl || !email || !apiToken) {
    return errorResponse(res, 'Missing credentials', 400);
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    await axios.get(`${baseUrl.replace(/\/$/, '')}/rest/api/3/myself`, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    });
    successResponse(res, { connected: true });
  } catch (err) {
    successResponse(res, { connected: false, error: 'Connection failed' });
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
