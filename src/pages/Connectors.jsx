import { useState, useEffect, useCallback } from 'react'
import { INTEGRATIONS } from '../constants'
import { useConnections } from '../hooks/useConnections'
import { connectionService } from '../services/api'
import { useToast } from '../components/Toast'

export default function Connectors() {
  const { connections, updateConnection } = useConnections()
  const { addToast } = useToast()
  const [statuses, setStatuses] = useState({})
  const [testing, setTesting]   = useState({})
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    const s = {}
    for (const k of Object.keys(connections)) s[k] = connections[k]?.connected ? 'connected' : 'idle'
    setStatuses(s)
  }, [connections])

  const togglePassword = (fieldKey) => {
    setShowPasswords(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }))
  }

  const save = (id, field, value) => {
    updateConnection(id, { [field]: value, connected: false })
    setStatuses(prev => ({ ...prev, [id]: 'idle' }))
  }

  const isFieldVisible = (integrationId, fieldKey, currentConfig) => {
    if (integrationId !== 'llm') return true;
    const provider = currentConfig?.provider;
    
    if (fieldKey === 'provider' || fieldKey === 'apiKey') return true;
    if (fieldKey.startsWith('ollama') && provider === 'ollama') return true;
    if (fieldKey.startsWith('groq') && provider === 'groq') return true;
    if (fieldKey.startsWith('gemini') && provider === 'gemini') return true;
    if (fieldKey.startsWith('custom') && provider === 'custom') return true;
    
    return false;
  }

  const testConnection = async (integration) => {
    setTesting(t => ({ ...t, [integration.id]: true }))
    setStatuses(s => ({ ...s, [integration.id]: 'testing' }))
    try {
      const config = connections[integration.id] || {}
      if (integration.id === 'llm') {
        const hasKey = !!(config.apiKey || config.provider === 'ollama')
        setStatuses(s => ({ ...s, [integration.id]: hasKey ? 'connected' : 'error' }))
        updateConnection(integration.id, { connected: hasKey })
        if (hasKey) addToast(`${integration.name} configuration saved!`, 'success')
        else addToast(`${integration.name} configuration is incomplete.`, 'warning')
        return
      }
      const resp = await connectionService.test(integration.id, config)
      const isConnected = resp.data.connected
      setStatuses(s => ({ ...s, [integration.id]: isConnected ? 'connected' : 'error' }))
      updateConnection(integration.id, { connected: isConnected })
      
      if (isConnected) {
        addToast(`Successfully connected to ${integration.name}!`, 'success')
      } else {
        addToast(`Failed to connect to ${integration.name}. Check your credentials.`, 'error')
      }
    } catch (e) {
      setStatuses(s => ({ ...s, [integration.id]: 'error' }))
      addToast(e.response?.data?.error || `Error connecting to ${integration.name}`, 'error')
    } finally {
      setTesting(t => ({ ...t, [integration.id]: false }))
    }
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
                  {integration.fields.map(field => {
                    if (!isFieldVisible(integration.id, field.key, connections[integration.id])) return null;
                    
                    return (
                      <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{field.label}</label>
                        <div style={{ position: 'relative' }}>
                          {field.type === 'select' ? (
                            <select
                              className="form-select"
                              value={connections[integration.id]?.[field.key] || ''}
                              onChange={e => save(integration.id, field.key, e.target.value)}
                            >
                              <option value="">Select provider…</option>
                              {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                            </select>
                          ) : (
                            <>
                              <input
                                type={field.type === 'password' ? (showPasswords[field.key] ? 'text' : 'password') : field.type}
                                className="form-input"
                                placeholder={field.placeholder}
                                value={connections[integration.id]?.[field.key] || ''}
                                onChange={e => save(integration.id, field.key, e.target.value)}
                              />
                              {field.type === 'password' && (
                                <button
                                  type="button"
                                  onClick={() => togglePassword(field.key)}
                                  style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: 'var(--text-muted)'
                                  }}
                                >
                                  {showPasswords[field.key] ? '👁️' : '👁️‍🗨️'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
