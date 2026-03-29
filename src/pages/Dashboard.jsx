import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STATS = [
  { icon: '📋', label: 'Test Plans Created', key: 'plans', color: 'var(--primary)' },
  { icon: '🔍', label: 'Stories Parsed',     key: 'stories', color: 'var(--accent)' },
  { icon: '🔌', label: 'Active Integrations',key: 'connections', color: 'var(--success)' },
  { icon: '📤', label: 'Plans Exported',     key: 'exports', color: 'var(--warning)' },
]

const INTEGRATIONS = [
  { id: 'jira', name: 'Jira',          icon: '🔷', desc: 'Atlassian Jira Cloud & Server', brand: '#0052CC' },
  { id: 'ado',  name: 'Azure DevOps',  icon: '🔵', desc: 'Microsoft Azure Boards / ADO',   brand: '#0078D4' },
  { id: 'xray', name: 'X-Ray',         icon: '🟢', desc: 'Xray Test Management for Jira',  brand: '#00875A' },
  { id: 'gh',   name: 'GitHub Issues', icon: '⚫', desc: 'GitHub Issues & Milestones',      brand: '#333' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ plans: 0, stories: 0, connections: 0, exports: 0 })

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('testPlanHistory') || '[]')
    const conns = JSON.parse(localStorage.getItem('connections') || '{}')
    setHistory(h.slice(0, 5))
    setStats({
      plans:   h.length,
      stories: h.length,
      connections: Object.keys(conns).filter(k => conns[k]?.connected).length,
      exports: parseInt(localStorage.getItem('exportCount') || '0')
    })
  }, [])

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Hero */}
      <div className="hero-gradient" style={{ marginBottom: 32, padding: '32px 0 0' }}>
        <div className="page-header">
          <h1>
            Welcome to <span className="text-gradient">Test Orchestrator</span>
          </h1>
          <p>Powered by the B.L.A.S.T. Framework — Generate AI-powered QA Test Plans from any project management tool</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/fetch')}>
            <span>🔍</span> Fetch Story &amp; Create Plan
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/connectors')}>
            <span>🔌</span> Configure Integrations
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {STATS.map(s => (
          <div key={s.key} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-value">{stats[s.key]}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Integrations Overview */}
        <div className="card">
          <div className="card-header">
            <h3>🔌 Integrations</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/connectors')}>Manage →</button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {INTEGRATIONS.map(int => {
              const connected = JSON.parse(localStorage.getItem('connections') || '{}')?.[int.id]?.connected
              return (
                <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 22 }}>{int.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{int.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{int.desc}</div>
                  </div>
                  <span className={`badge ${connected ? 'badge-success' : 'badge-muted'}`}>
                    {connected ? '● Connected' : '○ Not set'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Plans */}
        <div className="card">
          <div className="card-header">
            <h3>📁 Recent Test Plans</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View all →</button>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">No plans yet</div>
                <div className="empty-desc">Fetch a story and generate your first test plan</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => navigate('/history')}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{item.story?.id} — {item.story?.title?.substring(0, 40)}{item.story?.title?.length > 40 ? '…' : ''}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge priority-${item.story?.priority?.toLowerCase()}`}>{item.story?.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLAST Steps */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><h3>🚀 B.L.A.S.T. Framework Guide</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {[
              { letter: 'B', name: 'Blueprint',  desc: 'Define vision, data schema, integrations',       color: '#6366f1' },
              { letter: 'L', name: 'Link',        desc: 'Connect Jira / ADO / XRay & verify credentials', color: '#22d3ee' },
              { letter: 'A', name: 'Architect',   desc: 'Fetch story, extract QA signals, map test scope', color: '#10b981' },
              { letter: 'S', name: 'Stylize',     desc: 'AI generates structured 12-section test plan',   color: '#f59e0b' },
              { letter: 'T', name: 'Trigger',     desc: 'Export plan, share with team, close loop',       color: '#ec4899' },
            ].map(step => (
              <div key={step.letter} style={{ flex: '0 0 180px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, background: step.color + '20', color: step.color, border: `2px solid ${step.color}40`, borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                  {step.letter}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{step.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
