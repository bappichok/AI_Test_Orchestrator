import { useState, useEffect, useCallback } from 'react'

const INTEGRATIONS = [
  {
    id: 'jira',
    name: 'Jira',
    icon: '🔷',
    desc: 'Connect to Atlassian Jira Cloud or Server to fetch User Stories by Issue ID.',
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
    desc: 'Connect to Azure DevOps Boards to fetch Work Items by ID.',
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
    desc: 'Configure the AI engine used to generate test plans.',
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
]

export default function Connectors() {
  const [configs, setConfigs]   = useState({})
  const [statuses, setStatuses] = useState({})
  const [testing, setTesting]   = useState({})

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('connections') || '{}')
    setConfigs(saved)
    const s = {}
    for (const k of Object.keys(saved)) s[k] = saved[k]?.connected ? 'connected' : 'idle'
    setStatuses(s)
  }, [])

  const save = (id, field, value) => {
    setConfigs(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: value } }
      localStorage.setItem('connections', JSON.stringify(next))
      return next
    })
    setStatuses(prev => ({ ...prev, [id]: 'idle' }))
  }

  const testConnection = async (integration) => {
    setTesting(t => ({ ...t, [integration.id]: true }))
    setStatuses(s => ({ ...s, [integration.id]: 'testing' }))
    try {
      const config = configs[integration.id] || {}
      let resp
      if (integration.id === 'llm') {
        // Simple local validation for LLM — we can't test without making a paid call
        const hasKey = !!(config.apiKey || config.provider === 'ollama')
        setStatuses(s => ({ ...s, [integration.id]: hasKey ? 'connected' : 'error' }))
        updateConnected(integration.id, hasKey, config)
        return
      }
      resp = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: integration.id, config })
      })
      const data = await resp.json()
      setStatuses(s => ({ ...s, [integration.id]: data.connected ? 'connected' : 'error' }))
      updateConnected(integration.id, data.connected, config)
    } catch {
      setStatuses(s => ({ ...s, [integration.id]: 'error' }))
    } finally {
      setTesting(t => ({ ...t, [integration.id]: false }))
    }
  }

  const updateConnected = (id, connected, config) => {
    setConfigs(prev => {
      const next = { ...prev, [id]: { ...config, connected } }
      localStorage.setItem('connections', JSON.stringify(next))
      return next
    })
  }

  const statusMeta = {
    idle:      { label: 'Not tested',  cls: 'badge-muted' },
    testing:   { label: 'Testing…',   cls: 'badge-info' },
    connected: { label: '● Connected', cls: 'badge-success' },
    error:     { label: '✕ Failed',   cls: 'badge-danger' },
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb"><span>Home</span><span className="sep">/</span><span>Integrations</span></div>
        <h1>🔌 Integrations</h1>
        <p>Connect your project management tools and AI provider to start generating test plans.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {INTEGRATIONS.map(integration => {
          const st = statuses[integration.id] || 'idle'
          const meta = statusMeta[st]
          return (
            <div key={integration.id} className={`card ${st === 'connected' ? 'connected' : ''}`}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="integration-icon">{integration.icon}</div>
                  <div>
                    <div className="integration-name">{integration.name}</div>
                    <div className="integration-desc">{integration.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => testConnection(integration)}
                    disabled={testing[integration.id]}
                  >
                    {testing[integration.id] ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Testing…</> : '⚡ Test Connection'}
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="grid-2">
                  {integration.fields.map(field => (
                    <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          className="form-select"
                          value={configs[integration.id]?.[field.key] || ''}
                          onChange={e => save(integration.id, field.key, e.target.value)}
                        >
                          <option value="">Select provider…</option>
                          {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          className="form-input"
                          placeholder={field.placeholder}
                          value={configs[integration.id]?.[field.key] || ''}
                          onChange={e => save(integration.id, field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="alert alert-info" style={{ marginTop: 24 }}>
        💡 <strong>Tip:</strong> Credentials are stored in your browser's localStorage for this session. For production use, set them in your <code>.env</code> file on the server.
      </div>
    </div>
  )
}
