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

  const count = Math.min(Math.max(parseInt(settings?.count || 5, 10), 1), 20);
  const ratio = count <= 3
    ? `${count} test case(s): focus on the core happy path and one failure scenario.`
    : `Exactly ${count} test cases. Ratio: ~40% positive (happy path), ~30% negative (failure/invalid input), ~30% edge/boundary cases.`;

  const systemPrompt = `ROLE: You are a Senior QA Test Engineer expert in boundary value analysis, equivalence partitioning, and writing test cases that are executable without reading the original story.

INSTRUCTIONS:
1. Generate ${ratio}
2. Every test case must trace to a specific core functionality described in the description or acceptance criteria.
3. Steps must be imperative, numbered, and unambiguous. No vague steps like "click the button" — specify which button, what state, what input.
4. Expected results must be observable: reference UI messages, data states, HTTP status codes, or specific UI element states.
5. Priorities: Critical = happy path core flow, High = key failure case, Medium = edge/boundary, Low = UX/cosmetic.
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

  // Build attachment context for the user prompt
  const attachmentSection = (() => {
    const parts = [];
    if (story.attachmentTexts?.length) {
      parts.push('## ATTACHED FILES (read carefully — reference these in your test cases)');
      story.attachmentTexts.forEach(f => {
        parts.push(`### ${f.name}\n${f.content}`);
      });
    }
    if (story.attachmentImages?.length) {
      parts.push(`## ATTACHED IMAGES (${story.attachmentImages.map(i => i.name).join(', ')}) — Visual context attached by reporter.`);
    }
    // Manual uploaded files from frontend
    if (story.uploadedFiles?.length) {
      parts.push('## USER-UPLOADED FILES');
      story.uploadedFiles.forEach(f => {
        if (f.content) parts.push(`### ${f.name}\n${f.content}`);
        else parts.push(`### ${f.name} [Image attached by user]`);
      });
    }
    return parts.length ? '\n\n' + parts.join('\n\n') : '';
  })();

  const userPrompt = `Generate a JSON array of test cases using the strict Anti-Hallucination rules for the following user story:

## STORY DATA
- **ID**: ${story.id}
- **Title**: ${story.title}
- **Type**: ${story.type}
- **Priority**: ${story.priority}

## DESCRIPTION
${story.description || 'No description provided.'}

## ACCEPTANCE CRITERIA
${acSection}${attachmentSection}

OUTPUT YOUR RESPONSE AS A PURE JSON ARRAY ONLY. Generate exactly ${count} test cases.`;

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

// POST /api/generate/test-cases/single — regenerate one test case
router.post('/test-cases/single', async (req, res) => {
  const { story, settings, replaceId } = req.body;
  if (!story) return errorResponse(res, 'Missing story details', 400);

  const systemPrompt = `You are a Senior QA Test Engineer. Generate exactly ONE test case as a JSON object (not an array). Follow this structure exactly:
{
  "id": "${replaceId || 'TC-REG'}",
  "title": "...",
  "type": "...",
  "priority": "Critical|High|Medium|Low",
  "steps": ["Step 1", "Step 2"],
  "expected": ["Expected result 1"],
  "tags": ["tag1", "tag2"],
  "ac_traced": []
}
Output pure JSON only. No markdown, no explanation, no array wrapper.`;

  const acSection = story.acceptance_criteria?.length
    ? story.acceptance_criteria.map((ac, i) => `  ${i + 1}. ${ac}`).join('\n')
    : '  - No acceptance criteria provided.';

  const userPrompt = `Generate ONE replacement test case for story "${story.title}" (ID: ${story.id}).
Description: ${story.description || 'N/A'}
Acceptance Criteria:\n${acSection}
Make it different from the one being replaced (ID: ${replaceId}). Focus on an angle not yet covered.`;

  try {
    const content = await routeToLLM(systemPrompt, userPrompt, settings);
    let jsonContent = content.trim().replace(/^```json?/m, '').replace(/```$/m, '').trim();
    successResponse(res, { testCase: JSON.parse(jsonContent) });
  } catch (err) {
    errorResponse(res, `Single case regeneration failed: ${err.message}`, 500, err);
  }
});

// POST /api/generate/review-code — AI code quality review
router.post('/review-code', async (req, res) => {
  const { code, framework, settings } = req.body;
  if (!code) return errorResponse(res, 'Code is required', 400);

  const systemPrompt = `ROLE: You are a Principal QA Automation Architect doing a code review of automation test code.

Review the provided ${framework || 'automation'} code against these criteria:
1. POM_STRUCTURE: Page Object Model used (Page class + Test class separated)
2. NO_HARD_WAITS: No Thread.sleep() or waitForTimeout() with hardcoded numbers
3. ASSERTIONS: Every test method has at least one assertion with a failure message
4. LOCATOR_QUALITY: Prefers id/css over fragile XPath
5. NO_HARDCODED_CREDS: No hardcoded passwords, API keys, or base URLs
6. TEST_COVERAGE: One test method per test case ID found in comments/names
7. CI_READY: Headless-compatible, no GUI dependencies

Return ONLY a JSON object with this exact structure:
{
  "score": <integer 0-100>,
  "grade": "<letter grade A+/A/B+/B/C/D/F>",
  "passed": ["check name", ...],
  "warnings": ["description of warning", ...],
  "failed": ["description of failure", ...],
  "suggestion": "<one actionable improvement suggestion>"
}

Scoring: start at 100, deduct 15 per FAILED check, deduct 5 per WARNING. No markdown, no prose, pure JSON only.`;

  const userPrompt = `Review this ${framework || 'automation'} code:\n\n${code.slice(0, 8000)}`;

  try {
    const content = await routeToLLM(systemPrompt, userPrompt, settings);
    let jsonContent = content.trim().replace(/^```json?/m, '').replace(/```$/m, '').trim();
    const match = jsonContent.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse review JSON');
    successResponse(res, { review: JSON.parse(match[0]) });
  } catch (err) {
    errorResponse(res, `Code review failed: ${err.message}`, 500, err);
  }
});

// POST /api/generate/auto-fix-code — Re-generate code fixing identified issues
router.post('/auto-fix-code', async (req, res) => {
  const { code, framework, failedChecks, warnings, settings } = req.body;
  if (!code) return errorResponse(res, 'Code is required', 400);

  const issueList = [
    ...(failedChecks || []).map(f => `FAILED: ${f}`),
    ...(warnings || []).map(w => `WARNING: ${w}`)
  ].join('\n');

  const systemPrompt = `You are a Principal QA Automation Architect. Fix the provided ${framework || 'automation'} code to resolve the listed issues. Return ONLY the fixed code with no markdown backticks, no explanations — just the raw code.`;
  const userPrompt = `Fix the following issues in this ${framework} code:\n\nISSUES TO FIX:\n${issueList}\n\nCODE:\n${code.slice(0, 8000)}`;

  try {
    const content = await routeToLLM(systemPrompt, userPrompt, settings);
    let clean = content.trim().replace(/^```[\w]*\n/g, '').replace(/\n```$/g, '');
    successResponse(res, { code: clean });
  } catch (err) {
    errorResponse(res, `Auto-fix failed: ${err.message}`, 500, err);
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

    const systemPrompt = `ROLE: You are a Principal QA Automation Engineer with expertise in both Selenium (Java) and Playwright (JavaScript/TypeScript).
You write production-grade, maintainable automation frameworks following Page Object Model (POM) best practices.

INSTRUCTIONS:
1. Generate framework: ${framework}
2. Language: ${langDetails}
3. Use ONLY Page Object Model (POM) pattern:
   - Separate Page class(es) for UI element selectors and interactions
   - Separate Test class/file with test methods
   - Each page represents a logical page/component
4. Test Runner:
   - Selenium Java: TestNG with proper fixtures and teardown
   - Playwright JS/TS: Playwright Test with proper setup/teardown
5. Explicit Waits ONLY — Never use Thread.sleep() or hard waits:
   - Selenium Java: WebDriverWait + ExpectedConditions
   - Playwright JS/TS: await page.waitForSelector(), expect()
6. Every assertion must include a descriptive failure message
7. Locator preference order: id → css selector → name → XPath (only if unavoidable)
8. Environment variables:
   - BASE_URL: APP_BASE_URL with fallback http://localhost:3000
   - Credentials: Never hardcode — use process.env or System.getenv()
9. Browser lifecycle: Managed entirely by framework fixtures/hooks
10. CI/CD ready:
    - GitHub Actions compatible
    - Headless Chrome/Chromium mode
    - No UI dependencies
11. Clean Code Standards:
    - Descriptive variable/method names
    - Class-level and test-level comments/documentation
    - No magic numbers — use constants
    - Reusable helper methods
    - No unnecessary try/catch blocks suppressing failures
12. Code Structure:
    - Page Objects with clear method names reflecting user actions
    - Test file with @Test methods corresponding to each test case
    - Config/constants in separate file or at top of files
    - Proper error messages that aid debugging

OUTPUT FORMAT:
- Multiple files as needed (Page.js/Page.java, Test.js/Test.java, Config.js/Config.java)
- Each file is complete, runnable code
- Include all imports, setup, and teardown
- NO markdown backticks, NO explanatory text
- Code only, separated by file with clear file path comments at top

TONE: Silent decision-making. The code is the deliverable. Production-ready. No comments outside code blocks.`;

    const userPrompt = `Generate a complete, production-ready ${framework} automation test suite using Page Object Model for the following requirement:

${storyContext}

TEST CASES:
${testCasesContext}

REQUIREMENTS:
- Create separate Page Object file(s) and Test file(s)
- One test method per test case
- All test data externalized (no hardcoding)
- Descriptive assertions with failure messages
- Explicit waits only
- CI/CD ready (headless compatible)
- Return code files as plain text (no markdown), with file path indicators

For each file, prefix with: // FILE: path/to/FileName.ext

Generate the automation code now:`;

    const responseText = await routeToLLM(systemPrompt, userPrompt, llmSettings);
    
    let cleanCode = responseText.trim();
    if (cleanCode.startsWith('```')) {
      cleanCode = cleanCode.replace(/^```[\w]*\n/g, '').replace(/\n```$/g, '');
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
