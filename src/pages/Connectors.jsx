import { useState, useEffect } from 'react'
import { INTEGRATIONS } from '../constants'
import { useConnections } from '../hooks/useConnections'
import { connectionService } from '../services/api'
import { useToast } from '../components/Toast'

const STATUS_META = {
  idle:      { label: 'Not tested',  cls: 'badge-muted' },
  testing:   { label: 'Testing…',   cls: 'badge-info' },
  connected: { label: '● Connected', cls: 'badge-success' },
  error:     { label: '✕ Failed',   cls: 'badge-danger' },
}

const IntegrationCard = ({ 
  integration, 
  config, 
  status, 
  isTesting, 
  showPasswords, 
  onSave, 
  onTest, 
  onDisconnect, 
  onTogglePassword 
}) => {
  const meta = STATUS_META[status] || STATUS_META.idle;
  
  const isFieldVisible = (fieldKey) => {
    if (integration.id !== 'llm') return true;
    const provider = config?.provider;
    if (fieldKey === 'provider' || fieldKey === 'apiKey') return true;
    if (fieldKey.startsWith('ollama') && provider === 'ollama') return true;
    if (fieldKey.startsWith('groq') && provider === 'groq') return true;
    if (fieldKey.startsWith('gemini') && provider === 'gemini') return true;
    if (fieldKey.startsWith('custom') && provider === 'custom') return true;
    return false;
  }

  return (
    <div className={`premium-card ${status === 'connected' ? 'connected' : ''}`} style={{ marginBottom: '24px' }}>
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
          
          {status === 'connected' && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onDisconnect(integration)}
              disabled={isTesting}
            >
              Disconnect
            </button>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={() => onTest(integration)}
            disabled={isTesting}
          >
            {isTesting ? (
              <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Testing…</>
            ) : '⚡ Test Connection'}
          </button>
        </div>
      </div>
      
      <div className="card-body">
        <div className="grid-2">
          {integration.fields.map(field => {
            if (!isFieldVisible(field.key)) return null;
            return (
              <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{field.label}</label>
                <div style={{ position: 'relative' }}>
                  {field.type === 'select' ? (
                    <select
                      className="form-select"
                      value={config?.[field.key] || ''}
                      onChange={e => onSave(integration.id, field.key, e.target.value)}
                    >
                      <option value="">Select provider…</option>
                      {field.options.map(o => (
                        <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type={field.type === 'password' ? (showPasswords[field.key] ? 'text' : 'password') : field.type}
                        className="form-input"
                        placeholder={field.placeholder}
                        value={config?.[field.key] || ''}
                        onChange={e => onSave(integration.id, field.key, e.target.value)}
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => onTogglePassword(field.key)}
                          style={{
                            position: 'absolute', right: '10px', top: '50%',
                            transform: 'translateY(-50%)', background: 'none',
                            border: 'none', cursor: 'pointer', fontSize: '14px',
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
  );
};

export default function Connectors() {
  const { connections, updateConnection } = useConnections()
  const { addToast } = useToast()
  
  const [statuses, setStatuses] = useState({})
  const [testing, setTesting]   = useState({})
  const [showPasswords, setShowPasswords] = useState({})

  // Sync initial statuses based on connections in local storage
  useEffect(() => {
    const initialStatuses = {}
    for (const key of Object.keys(connections)) {
      initialStatuses[key] = connections[key]?.connected ? 'connected' : 'idle'
    }
    setStatuses(initialStatuses)
  }, [connections])

  const togglePassword = (fieldKey) => {
    setShowPasswords(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }))
  }

  const handleSaveField = (integrationId, fieldKey, value) => {
    updateConnection(integrationId, { [fieldKey]: value, connected: false })
    setStatuses(prev => ({ ...prev, [integrationId]: 'idle' }))
  }

  const handleDisconnect = (integration) => {
    updateConnection(integration.id, { connected: false })
    setStatuses(prev => ({ ...prev, [integration.id]: 'idle' }))
    addToast(`${integration.name} disconnected successfully.`, 'info')
  }

  const handleTestConnection = async (integration) => {
    setTesting(t => ({ ...t, [integration.id]: true }))
    setStatuses(s => ({ ...s, [integration.id]: 'testing' }))
    
    try {
      const config = connections[integration.id] || {}
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

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            ⚙️ CORE INFRASTRUCTURE
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>System Connectors</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Establish secure handshakes with Jira, Azure DevOps, and your high-performance LLM compute providers.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {INTEGRATIONS.map(integration => (
          <IntegrationCard 
            key={integration.id}
            integration={integration}
            config={connections[integration.id]}
            status={statuses[integration.id]}
            isTesting={testing[integration.id]}
            showPasswords={showPasswords}
            onSave={handleSaveField}
            onTest={handleTestConnection}
            onDisconnect={handleDisconnect}
            onTogglePassword={togglePassword}
          />
        ))}
      </div>

      <div className="alert alert-info" style={{ marginTop: 24 }}>
        💡 <strong>Tip:</strong> Credentials are stored in your browser's localStorage for this session. For production use, set them in your <code>.env</code> file on the server.
      </div>
    </div>
  )
}
