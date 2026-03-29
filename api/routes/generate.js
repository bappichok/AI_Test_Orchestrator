import express from 'express';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const TEST_PLAN_TEMPLATE = `
# {PROJECT_NAME} — Test Plan

## 1. Objective
{OBJECTIVE}

## 2. Scope
{SCOPE}

## 3. Inclusions (Features/Modules to Test)
{INCLUSIONS}

## 4. Test Environments
{TEST_ENVIRONMENTS}

## 5. Defect Reporting Procedure
{DEFECT_REPORTING}

## 6. Test Strategy
{TEST_STRATEGY}

## 7. Test Schedule
{TEST_SCHEDULE}

## 8. Test Deliverables
{TEST_DELIVERABLES}

## 9. Entry & Exit Criteria
### Requirement Analysis
**Entry:** {REQ_ENTRY}
**Exit:** {REQ_EXIT}

### Test Execution
**Entry:** {EXEC_ENTRY}
**Exit:** {EXEC_EXIT}

### Test Closure
**Entry:** {CLOSURE_ENTRY}
**Exit:** {CLOSURE_EXIT}

## 10. Tools
{TOOLS}

## 11. Risks & Mitigations
{RISKS}

## 12. Approvals
{APPROVALS}
`;

// POST /api/generate/test-plan
router.post('/test-plan', async (req, res) => {
  const { story, projectName, settings } = req.body;
  if (!story) return res.status(400).json({ error: 'story is required.' });

  const provider = settings?.llmProvider || process.env.LLM_PROVIDER || 'openai';

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(story, projectName, settings);

  try {
    let content = '';

    if (provider === 'openai') {
      content = await callOpenAI(systemPrompt, userPrompt, settings);
    } else if (provider === 'anthropic') {
      content = await callAnthropic(systemPrompt, userPrompt, settings);
    } else if (provider === 'ollama') {
      content = await callOllama(systemPrompt, userPrompt, settings);
    } else if (provider === 'groq') {
      content = await callGroq(systemPrompt, userPrompt, settings);
    } else if (provider === 'custom') {
      content = await callCustom(systemPrompt, userPrompt, settings);
    } else if (provider === 'gemini') {
      content = await callGemini(systemPrompt, userPrompt, settings);
    } else {
      return res.status(400).json({ error: `Unknown LLM provider: ${provider}` });
    }

    res.json({ success: true, testPlan: content, story });
  } catch (err) {
    const apiError = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    console.error('LLM Error:', apiError);
    res.status(500).json({ error: `LLM generation failed: ${apiError}` });
  }
});

// POST /api/generate/test-cases
router.post('/test-cases', async (req, res) => {
  const { story, settings } = req.body;
  if (!story) return res.status(400).json({ error: 'story is required.' });

  const provider = settings?.llmProvider || process.env.LLM_PROVIDER || 'openai';

  const systemPrompt = `ROLE: You are a Senior QA Test Engineer expert in boundary value analysis, equivalence partitioning, and writing test cases that are executable without reading the original story.

INSTRUCTIONS:
1. For each user story below, generate 3-5 test cases: 1 positive (happy path), 1 negative, 1+ edge/boundary case.
2. Every test case must trace to a specific core functionality described in the description or acceptance criteria.
3. Steps must be imperative, numbered, and unambiguous. No vague steps like "click the button" — specify which button, what state, what input.
4. Expected results must be observable: reference UI messages, data states, HTTP status codes, or specific UI element states.
5. Priorities: Critical = happy path core flow, High = key failure case, Medium = edge/boundary, Low =UX/cosmetic.
6. No duplicate test cases. No test cases for out-of-scope items.
7. Preconditions must describe the exact starting state (user logged in / not logged in, data present, etc).

CONTEXT: Junior QA engineers will execute these steps with no access to the original story. Steps must be 100% self-contained. Assume a clean browser session unless preconditions state otherwise. If no Acceptance Criteria are provided, logically infer the core features from the Description.

PARAMETERS:
- Steps: 3-7 items per test case
- No step may use 'verify', 'check', or 'make sure' — use specific observable actions
- expected: must reference a specific UI element, message text, URL, or data state
- tags: minimum 2, must include domain (e.g. auth, cart) and type (e.g. negative, boundary)
- IDs sequential: TC-001, TC-002, TC-003...
- ac_traced: an array of integers representing the numbered Acceptance Criteria this test case covers (e.g., [1, 2]). If no ACs were provided, use [].

OUTPUT: JSON array only. No markdown. No prose. No explanation. Your exact response must be directly parseable by JSON.parse().

TONE: Imperative. Precise. Every word serves the tester. No ambiguity tolerated.`;

  const acSection = story.acceptance_criteria?.length
    ? story.acceptance_criteria.map((ac, i) => `  ${i + 1}. ${ac}`).join('\n')
    : '  - No acceptance criteria provided.';

  const userPrompt = `Generate a JSON array of test cases using the strict Anti-Hallucination rules for the following user story:

## STORY DATA
- **ID**: ${story.id}
- **Title**: ${story.title}
- **Type**: ${story.type}
- **Priority**: ${story.priority}

## DESCRIPTION
${story.description || 'No description provided.'}

## ACCEPTANCE CRITERIA
${acSection}

OUTPUT YOUR RESPONSE AS A PURE JSON ARRAY ONLY.`;

  try {
    let content = '';
    if (provider === 'openai') {
      content = await callOpenAI(systemPrompt, userPrompt, settings);
    } else if (provider === 'anthropic') {
      content = await callAnthropic(systemPrompt, userPrompt, settings);
    } else if (provider === 'ollama') {
      content = await callOllama(systemPrompt, userPrompt, settings);
    } else if (provider === 'groq') {
      content = await callGroq(systemPrompt, userPrompt, settings);
    } else if (provider === 'custom') {
      content = await callCustom(systemPrompt, userPrompt, settings);
    } else if (provider === 'gemini') {
      content = await callGemini(systemPrompt, userPrompt, settings);
    } else {
      return res.status(400).json({ error: `Unknown LLM provider: ${provider}` });
    }

    // Attempt to sanitize any markdown fences returning the JSON
    let jsonContent = content;
    if (jsonContent.startsWith('\`\`\`json')) {
      jsonContent = jsonContent.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
    } else if (jsonContent.startsWith('\`\`\`')) {
      jsonContent = jsonContent.replace(/^\`\`\`/m, '').replace(/\`\`\`$/m, '').trim();
    }

    res.json({ success: true, testCases: JSON.parse(jsonContent), story });
  } catch (err) {
    const apiError = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    console.error('LLM Error:', apiError);
    // Include full text dump in case JSON.parse fails
    res.status(500).json({ error: `LLM Test Case generation/parsing failed: ${apiError}`, raw: err.message });
  }
});

function buildSystemPrompt() {
  return `You are a Senior QA Engineer with 15+ years of enterprise Agile experience specializing in writing comprehensive, actionable test plans.
You follow the B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger) QA framework.
Your test plans are structured, professional, and based ONLY on the data provided — you never invent details.
Output must be a valid Markdown test plan following the exact template structure provided.`;
}

function buildUserPrompt(story, projectName, settings) {
  const acSection = story.acceptance_criteria?.length
    ? story.acceptance_criteria.map((ac, i) => `  ${i + 1}. ${ac}`).join('\n')
    : '  - No acceptance criteria provided.';

  const flagWarnings = story.flags?.length
    ? `\n⚠️ FLAGS: ${story.flags.join(', ')} — Account for these gaps in your test plan.`
    : '';

  return `Generate a complete QA Test Plan for the following user story using the B.L.A.S.T. framework.

## STORY DATA
- **ID**: ${story.id}
- **Title**: ${story.title}
- **Type**: ${story.type}
- **Priority**: ${story.priority}
- **Epic/Feature**: ${story.epic || 'Not specified'}
- **Labels**: ${story.labels?.join(', ') || 'None'}
- **Status**: ${story.status || 'N/A'}
- **Assignee**: ${story.assignee || 'Unassigned'}

## DESCRIPTION
${story.description || 'No description provided.'}

## ACCEPTANCE CRITERIA
${acSection}
${flagWarnings}

## PROJECT CONTEXT
- Project Name: ${projectName || story.id + ' Feature'}
- Test Environment: ${settings?.environment || 'QA, Staging, Production'}
- Platform: ${settings?.platform || 'Web Application (Chrome, Firefox, Safari, Edge)'}
- Testing Type: ${settings?.testingTypes || 'Functional, Regression, UI/UX, API'}
- Team: ${settings?.team || 'QA Team'}

## INSTRUCTIONS
1. Write a COMPLETE test plan with ALL 12 sections populated.
2. For Section 3 (Inclusions), list at least 5 specific test scenarios derived from the story.
3. For Section 6 (Test Strategy), list applicable techniques: Equivalence Class Partitioning, Boundary Value Analysis, Decision Table Testing, State Transition Testing, Error Guessing, Exploratory Testing.
4. For Section 11 (Risks), identify at least 3 risks relevant to THIS specific story.
5. Do NOT leave any section empty. If data is missing, make reasonable QA-professional assumptions and mark them with [ASSUMED].
6. The entire response must be a valid Markdown document. No preamble, no meta-commentary — just the test plan.

Generate the test plan now:`;
}

async function callOpenAI(systemPrompt, userPrompt, settings) {
  const apiKey = settings?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set in .env or configured in UI Integrations tab');

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userPrompt, settings) {
  const apiKey = settings?.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env or configured in UI Integrations tab');

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.content[0].text;
}

async function callOllama(systemPrompt, userPrompt, settings) {
  const baseUrl = settings?.ollamaUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = settings?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3';

  const response = await axios.post(
    `${baseUrl}/api/chat`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      options: { temperature: 0.3 }
    }
  );

  return response.data.message.content;
}

async function callGroq(systemPrompt, userPrompt, settings) {
  const apiKey = settings?.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env or passed from UI');
  
  const model = settings?.groqModel || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function callCustom(systemPrompt, userPrompt, settings) {
  const baseUrl = settings?.customUrl || process.env.CUSTOM_API_URL || 'http://localhost:1234/v1';
  const model = settings?.customModel || 'local-model';
  const apiKey = settings?.apiKey || process.env.CUSTOM_API_KEY || 'sk-no-key';
  
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    },
    { headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      } 
    }
  );
  
  return response.data.choices[0].message.content;
}

async function callGemini(systemPrompt, userPrompt, settings) {
  const apiKey = settings?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env or configured in UI');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: settings?.geminiModel || 'gemini-1.5-flash' });
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.3 }
  });
  
  return result.response.text();
}

export default router;
