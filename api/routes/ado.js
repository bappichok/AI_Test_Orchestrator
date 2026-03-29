import express from 'express';
import axios from 'axios';
import { resolveAdoCredentials } from '../utils/credentialHandler.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

const router = express.Router();

// POST /api/ado/fetch — fetch Azure DevOps Work Item by ID
router.post('/fetch', async (req, res) => {
  const { workItemId } = req.body;
  const { org, project, token } = resolveAdoCredentials(req.body);

  if (!org || !token || !workItemId) {
    return errorResponse(res, 'ADO org, token, and workItemId are required.', 400);
  }

  try {
    const auth = Buffer.from(`:${token}`).toString('base64');
    const url = `https://dev.azure.com/${org}/${project ? project + '/' : ''}_apis/wit/workitems/${workItemId}?api-version=7.0&$expand=all`;

    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    });

    const item = response.data;
    const fields = item.fields;

    const descHtml = fields['System.Description'] || '';
    const descText = stripHtml(descHtml);
    const acHtml = fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '';
    const acText = stripHtml(acHtml);
    const acLines = acText ? acText.split('\n').filter(l => l.trim()) : [];

    // Extract attachments
    const attachments = (item.relations || [])
      .filter(rel => rel.rel === 'AttachmentLink')
      .map(rel => ({
        name: rel.attributes?.name || 'Attachment',
        url: rel.url,
        mimeType: rel.attributes?.resourceType || 'application/octet-stream',
        size: rel.attributes?.length || 0
      }));

    const flags = [];
    if (acLines.length === 0) flags.push('MISSING_AC');
    if (descText.split(' ').filter(w => w).length < 20) flags.push('VAGUE_DESC');

    const normalized = {
      id: `ADO-${workItemId}`,
      title: fields['System.Title'] || '',
      description: descText,
      acceptance_criteria: acLines,
      attachments: attachments,
      priority: normalizePriority(fields['Microsoft.VSTS.Common.Priority']),
      type: fields['System.WorkItemType'] || 'User Story',
      epic: fields['System.AreaPath'] || '',
      labels: fields['System.Tags'] ? fields['System.Tags'].split(';').map(t => t.trim()) : [],
      status: fields['System.State'] || '',
      assignee: fields['System.AssignedTo']?.displayName || 'Unassigned',
      reporter: fields['System.CreatedBy']?.displayName || '',
      flags
    };

    successResponse(res, { story: normalized });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return errorResponse(res, 'Invalid ADO credentials.', 401);
    if (status === 404) return errorResponse(res, `Work item ${workItemId} not found.`, 404);
    errorResponse(res, err.message, 500, err);
  }
});

// POST /api/ado/test — verify connectivity
router.post('/test', async (req, res) => {
  const { org, token } = resolveAdoCredentials(req.body);
  if (!org || !token) return errorResponse(res, 'Missing credentials', 400);
  try {
    const auth = Buffer.from(`:${token}`).toString('base64');
    await axios.get(`https://dev.azure.com/${org}/_apis/projects?api-version=7.0`, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
    });
    successResponse(res, { connected: true });
  } catch (err) {
    successResponse(res, { connected: false, error: 'Connection failed' });
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
