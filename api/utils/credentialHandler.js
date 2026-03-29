/**
 * Credential Handler Utility
 * Resolves credentials from either the request body (UI-provided) or environment variables.
 */

export const resolveJiraCredentials = (config = {}) => {
  return {
    baseUrl: config.baseUrl || process.env.JIRA_BASE_URL,
    email: config.email || process.env.JIRA_EMAIL,
    apiToken: config.apiToken || process.env.JIRA_API_TOKEN,
  };
};

export const resolveAdoCredentials = (config = {}) => {
  return {
    org: config.org || process.env.ADO_ORG,
    project: config.project || process.env.ADO_PROJECT,
    token: config.token || process.env.ADO_TOKEN,
  };
};

export const resolveLlmCredentials = (settings = {}) => {
  const provider = settings.llmProvider || process.env.LLM_PROVIDER || 'openai';
  return {
    provider,
    apiKey: settings.apiKey || getEnvKey(provider),
    baseUrl: settings.customUrl || settings.ollamaUrl || getEnvUrl(provider),
    model: settings.customModel || settings.ollamaModel || settings.groqModel || settings.geminiModel || getEnvModel(provider)
  };
};

function getEnvKey(provider) {
  switch (provider) {
    case 'openai': return process.env.OPENAI_API_KEY;
    case 'anthropic': return process.env.ANTHROPIC_API_KEY;
    case 'groq': return process.env.GROQ_API_KEY;
    case 'gemini': return process.env.GEMINI_API_KEY;
    default: return null;
  }
}

function getEnvUrl(provider) {
  switch (provider) {
    case 'ollama': return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    case 'custom': return process.env.CUSTOM_API_URL;
    default: return null;
  }
}

function getEnvModel(provider) {
  switch (provider) {
    case 'ollama': return process.env.OLLAMA_MODEL || 'llama3';
    case 'groq': return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    case 'gemini': return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    default: return null;
  }
}
