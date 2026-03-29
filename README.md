# AI Test Orchestrator

> Generate professional QA Test Plans from Jira, Azure DevOps & XRay stories — powered by the **B.L.A.S.T. Framework** and AI.

## ✨ Features

- 🔌 **Multi-platform connectors**: Jira, Azure DevOps, Demo Mode
- 🤖 **AI-powered generation**: OpenAI, Anthropic, Gemini, Groq, Ollama, and Custom OpenAI-Compatible Endpoints.
- 📋 **Test Plans**: 12-section structured test plans based on enterprise QA templates.
- 🧪 **Dedicated Test Case Generator**: Generate tabular Jira-style test cases directly from user stories.
- 🎯 **Coverage Traceability Matrix**: Automatically maps generated test cases back to Jira Acceptance Criteria.
- 🔍 **BLAST signal extraction**: Normalizes priority, detects `MISSING_AC` / `VAGUE_DESC` flags
- 📥 **Export**: Markdown download
- 📁 **History**: Browse, search, re-export past plans
- 🚀 **Vercel-ready** deployment

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run development server
npm run dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_PROVIDER` | Yes | `openai` / `anthropic` / `ollama` / `groq` |
| `OPENAI_API_KEY` | If OpenAI | Your OpenAI key |
| `ANTHROPIC_API_KEY` | If Anthropic | Your Claude key |
| `GROQ_API_KEY` | If Groq | Your Groq API key |
| `JIRA_BASE_URL` | Optional | `https://yourorg.atlassian.net` |
| `JIRA_EMAIL` | Optional | Jira account email |
| `JIRA_API_TOKEN` | Optional | Atlassian API token |
| `ADO_ORG` | Optional | Azure DevOps organization |
| `ADO_TOKEN` | Optional | ADO Personal Access Token |

> 💡 Credentials can also be entered in the UI at runtime (stored in `localStorage`)

## 🏗️ B.L.A.S.T. Framework

| Letter | Phase | What happens |
|--------|-------|--------------|
| **B** | Blueprint | Define story schema + validate inputs |
| **L** | Link | Connect Jira / ADO / XRay |
| **A** | Architect | Extract QA signals from story |
| **S** | Stylize | AI generates all 12 test plan sections |
| **T** | Trigger | Export & share test plan |

## 🌐 Deploy to Vercel

```bash
npx vercel --prod
```

Set environment variables in the Vercel dashboard.

## 📋 Test Plan Sections Generated

1. Objective | 2. Scope | 3. Inclusions | 4. Test Environments | 5. Defect Reporting
6. Test Strategy | 7. Test Schedule | 8. Deliverables | 9. Entry/Exit Criteria
10. Tools | 11. Risks & Mitigations | 12. Approvals
