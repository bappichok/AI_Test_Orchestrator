export const INTEGRATIONS = [
  {
    id: 'jira',
    name: 'Jira',
    icon: '🔷',
    desc: 'Atlassian Jira Cloud & Server',
    brand: '#0052CC',
    fields: [
      { key: 'baseUrl',  label: 'Jira Base URL',  placeholder: 'https://yourorg.atlassian.net', type: 'url' },
      { key: 'email',    label: 'Email',           placeholder: 'you@example.com',               type: 'email' },
      { key: 'apiToken', label: 'API Token',       placeholder: 'Your Atlassian API Token',       type: 'password' },
    ]
  },
  {
    id: 'ado',
    name: 'Azure DevOps',
    icon: '🔵',
    desc: 'Microsoft Azure Boards / ADO',
    brand: '#0078D4',
    fields: [
      { key: 'org',     label: 'Organization', placeholder: 'your-ado-org',  type: 'text' },
      { key: 'project', label: 'Project',       placeholder: 'MyProject',     type: 'text' },
      { key: 'token',   label: 'PAT Token',     placeholder: 'Personal Access Token', type: 'password' },
    ]
  },
  {
    id: 'llm',
    name: 'LLM / AI Provider',
    icon: '🤖',
    desc: 'AI engine used to generate test plans.',
    brand: '#6366f1',
    fields: [
      { key: 'provider',   label: 'Provider',     placeholder: '',            type: 'select', options: ['openai', 'anthropic', 'ollama', 'groq', 'gemini', 'custom'] },
      { key: 'apiKey',     label: 'API Key',       placeholder: 'sk-...',      type: 'password' },
      { key: 'ollamaUrl',  label: 'Ollama URL', placeholder: 'http://localhost:11434', type: 'url' },
      { key: 'ollamaModel',label: 'Ollama Model',  placeholder: 'llama3',      type: 'text' },
      { key: 'groqModel',  label: 'Groq Model', placeholder: 'llama-3.3-70b-versatile', type: 'text' },
      { key: 'geminiModel',label: 'Gemini Model',  placeholder: 'gemini-1.5-flash', type: 'text' },
      { key: 'customUrl',  label: 'Custom Base URL (OpenAI-Compatible)', placeholder: 'http://localhost:1234/v1', type: 'url' },
      { key: 'customModel',label: 'Custom Model ID', placeholder: 'local-model', type: 'text' },
    ]
  },
  { id: 'xray', name: 'X-Ray',         icon: '🟢', desc: 'Xray Test Management for Jira',  brand: '#00875A', fields: [] },
  { id: 'gh',   name: 'GitHub Issues', icon: '⚫', desc: 'GitHub Issues & Milestones',      brand: '#333', fields: [] },
]

export const STATS_CONFIG = [
  { icon: '📋', label: 'Test Plans Created', key: 'plans', color: 'var(--primary)' },
  { icon: '🔍', label: 'Stories Parsed',     key: 'stories', color: 'var(--accent)' },
  { icon: '🔌', label: 'Active Integrations',key: 'connections', color: 'var(--success)' },
  { icon: '📤', label: 'Plans Exported',     key: 'exports', color: 'var(--warning)' },
]
