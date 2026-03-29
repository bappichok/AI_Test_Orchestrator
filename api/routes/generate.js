import express from 'express';
import { routeToLLM } from '../services/aiOrchestrator.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

const router = express.Router();

// POST /api/generate/test-plan
router.post('/test-plan', async (req, res) => {
  const { story, projectName, settings } = req.body;
  if (!story) return errorResponse(res, 'Story details are required', 400);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(story, projectName, settings);

  try {
    const content = await routeToLLM(systemPrompt, userPrompt, settings);
    successResponse(res, { testPlan: content, story });
  } catch (err) {
    errorResponse(res, `Test Plan generation failed: ${err.message}`, 500, err);
  }
});

// POST /api/generate/test-cases
router.post('/test-cases', async (req, res) => {
  const { story, settings } = req.body;
  if (!story) return errorResponse(res, 'Missing story details', 400);

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
- title: A short, descriptive title for the test case
- type: Functional, UI/UX, Performance, Security, etc.
- priority: Critical, High, Medium, Low
- ac_traced: an array of integers representing the numbered Acceptance Criteria this test case covers (e.g., [1, 2]). If no ACs were provided, use [].
- steps: An array of strings for each test step
- expected: An array of strings for each expected result

OUTPUT: JSON array only. No markdown. No prose. No explanation. Your exact response must be directly parseable by JSON.parse().
Each object in the array MUST follow this structure exactly:
{
  "id": "TC-001",
  "title": "...",
  "type": "...",
  "priority": "...",
  "steps": ["Step 1", "Step 2"],
  "expected": ["Expected 1", "Expected 2"],
  "tags": ["tag1", "tag2"],
  "ac_traced": []
}

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
    const content = await routeToLLM(systemPrompt, userPrompt, settings);
    
    // Sanitize any markdown fences
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json/m, '').replace(/```$/m, '').trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```/m, '').replace(/```$/m, '').trim();
    }

    successResponse(res, { testCases: JSON.parse(jsonContent), story });
  } catch (err) {
    errorResponse(res, `Test Case generation failed: ${err.message}`, 500, err);
  }
});

router.post('/analytics', async (req, res) => {
  try {
    const { testCases, llmSettings } = req.body;
    if (!testCases || !Array.isArray(testCases)) return errorResponse(res, 'testCases array required', 400);

    const systemPrompt = `ROLE: You are a QA Analytics Expert who transforms raw test case data into actionable dashboard metrics for QA leads.

INSTRUCTIONS:
1. Accept the test case JSON array provided below.
2. Compute: total count, breakdown by priority (critical/high/medium/low), breakdown by type (functional/negative/boundary/integration/security/ui).
3. Compute coverage: how many unique stories are covered, average test cases per story.
4. Identify gaps: stories with fewer than 2 test cases, stories with no negative tests, stories with no boundary tests.
5. Flag quality issues: test cases where expected result is under 20 characters → flag as LOW_QUALITY_EXPECTED.
6. Do NOT re-return the original test case objects in your output.

CONTEXT: Output feeds a live QA dashboard used by sprint leads. Must be clean, machine-readable JSON. Leads use this data to triage coverage before execution begins.

EXAMPLE OUTPUT:
{
  "summary": {
    "total": 14,
    "by_priority": { "critical": 3, "high": 5, "medium": 5, "low": 1 },
    "by_type": { "functional": 7, "negative": 4, "boundary": 2, "security": 1 }
  },
  "coverage": {
    "stories_covered": 5,
    "total_stories": 5,
    "coverage_percent": 100.0,
    "avg_cases_per_story": 2.8
  },
  "gaps": [
    { "story_id": "PROJ-103", "issue": "No boundary test cases found" },
    { "story_id": "PROJ-105", "issue": "Only 1 test case — below minimum threshold of 2" }
  ],
  "flags": [
    { "id": "TC-009", "issue": "LOW_QUALITY_EXPECTED: expected result is only 12 characters" }
  ]
}

PARAMETERS:
- All count values must be integers
- Percentages and averages: 1 decimal place only
- gaps: empty array [] if no gaps — never omit this key
- flags: empty array [] if no issues — never omit this key
- No fabricated or estimated values — compute only from input data

OUTPUT: Pure JSON object. No markdown. No prose. No explanation.

TONE: Analytical. Precise. Machine-readable. All meaning is in the data structure, not in text.`;

    const userPrompt = `TEST CASES:\n${JSON.stringify(testCases, null, 2)}`;
    
    const responseText = await routeToLLM(systemPrompt, userPrompt, llmSettings);
    
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse analytics JSON from LLM response.');
    
    successResponse(res, { analytics: JSON.parse(jsonMatch[0]) });
  } catch (error) {
    errorResponse(res, `Analytics generation failed: ${error.message}`, 500, error);
  }
});

router.post('/automation-code', async (req, res) => {
  try {
    const { testCases, story, framework, llmSettings } = req.body;
    
    let testCasesArray = Array.isArray(testCases) ? testCases : (req.body.testCase ? [req.body.testCase] : []);
    
    if (testCasesArray.length === 0 || !framework) {
      return errorResponse(res, 'testCases array and framework are required', 400);
    }

    let langDetails = "JavaScript / TypeScript";
    if (framework.toLowerCase().includes('selenium')) langDetails = "Java";
    if (framework.toLowerCase().includes('python')) langDetails = "Python";

    const storyContext = story ? `
CONTEXT (Story/Epic/Task):
- ID: ${story.id}
- Title: ${story.title}
- Description: ${story.description || 'N/A'}
- Epic: ${story.epic || 'N/A'}
- Labels: ${story.labels?.join(', ') || 'N/A'}
` : 'CONTEXT: No specific story context provided.';

    const testCasesContext = testCasesArray.map((tc, idx) => `
Test Case ${idx + 1}:
- ID: ${tc.id || tc.ID}
- Title: ${tc.title || 'Test Case'}
- Priority: ${tc.priority || 'Medium'}
- Preconditions: ${tc.preconditions || 'None'}
- Steps:
${Array.isArray(tc.steps) ? tc.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n') : tc.steps || 'N/A'}
- Expected Results:
${Array.isArray(tc.expected) ? tc.expected.map((e, i) => `  - ${e}`).join('\n') : tc.expected || 'N/A'}
${tc.tags ? `- Tags: ${tc.tags.join(', ')}` : ''}
    `).join('\n');

    const systemPrompt = `ROLE: You are an expert SDET (Software Development Engineer in Test).
Your job is to convert a set of manual test cases into a robust, executable, production-ready automation function.

INSTRUCTIONS:
1. Framework requested: ${framework}
2. Language requested: ${langDetails}
3. Create ONE complete function/class that covers ALL test cases provided.
4. Use the Page Object Model (POM) pattern if applicable, or a well-structured standalone implementation.
5. Include all necessary imports and setup.
6. Provide explicit wait strategies (no hard sleeps).
7. Each test case should be a separate test method/function within the main test suite/class.
8. Use proper assertions and error handling.
9. The code must be production-ready and executable immediately.
10. Print ONLY the code. Do not include markdown code block backticks, do not output conversational text.
11. Organize the code logically with:
    - Imports at the top
    - Setup/Configuration
    - Page Objects (if applicable)
    - Test Methods (one per test case)
    - Helper functions
    - Teardown/Cleanup`;

    const userPrompt = `Generate a complete, production-ready ${framework} automation test suite for the following requirement:

${storyContext}

TEST CASES:
${testCasesContext}

REQUIREMENTS:
- Create a single test file/class that includes all test cases
- Use descriptive names for test methods based on the story and test case titles
- Include proper setup and teardown
- Add meaningful comments
- Ensure all assertions match the expected results exactly`;

    const responseText = await routeToLLM(systemPrompt, userPrompt, llmSettings);
    
    let cleanCode = responseText.trim();
    if (cleanCode.startsWith('```')) {
      cleanCode = cleanCode.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
    }

    successResponse(res, { code: cleanCode });
  } catch (error) {
    errorResponse(res, `Automation Code generation failed: ${error.message}`, 500, error);
  }
});

// Helper functions for Test Plan
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

export default router;
