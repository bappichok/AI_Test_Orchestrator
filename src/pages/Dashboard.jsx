import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { INTEGRATIONS, STATS_CONFIG } from '../constants'
import { useConnections } from '../hooks/useConnections'

export default function Dashboard() {
  const navigate = useNavigate()
  const { connections } = useConnections()
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ plans: 0, stories: 0, connections: 0, exports: 0 })

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('testPlanHistory') || '[]')
    setHistory(h.slice(0, 5))
    setStats({
      plans:   h.length,
      stories: h.length,
      connections: Object.keys(connections).filter(k => connections[k]?.connected).length,
      exports: parseInt(localStorage.getItem('exportCount') || '0')
    })
  }, [connections])

  const hasConnections = Object.values(connections).some(c => c.connected)

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* ── Dashboard Hero ──────────────────────────── */}
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            🚀 ENGINE START
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Test Orchestrator</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>The professional B.L.A.S.T. framework runner. Synthesize AI-powered test architectures from Jira, Azure DevOps, or raw requirements.</p>
        </div>
      </div>

      {!hasConnections && (
        <div className="premium-card" style={{ marginBottom: 32, background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>🚀 Ready to build?</h3>
            <p style={{ margin: '4px 0 0', opacity: 0.7 }}>You haven't connected any integrations yet. Connect your workforce tools to begin.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/connectors')}>
            Configure Handshake
          </button>
        </div>
      )}

      {/* ── Action Bar ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/fetch')} style={{ padding: '16px 32px' }}>
          <span>🔍</span> Fetch Story &amp; Orchestrate
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/connectors')} style={{ padding: '16px 32px' }}>
          <span>🔌</span> System Connectors
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 40 }}>
        {STATS_CONFIG.map(s => (
          <div key={s.key} className="premium-metric">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              <span style={{ fontSize: 18, background: s.color + '20', width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0' }}>{stats[s.key]}</div>
            <div style={{ height: 4, width: '100%', background: 'var(--border)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: stats[s.key] > 0 ? '60%' : '0%', background: s.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid" style={{ marginBottom: 40 }}>
        {/* Recent Plans */}
        <div className="premium-card">
          <h2>📁 Execution History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length > 0 ? (
              history.map((h, i) => (
                <div key={i} className="nav-item" onClick={() => {
                  sessionStorage.setItem('viewHistoryPlan', JSON.stringify(h))
                  navigate('/history')
                }} style={{ padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-light)' }}>{h.story?.id || 'Manual'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.story?.title || 'Generated Plan'}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No local history compiled yet.</div>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/history')}>View All Protocols →</button>
          </div>
        </div>

        {/* Integrations Overview */}
        <div className="premium-card">
          <h2>🔌 System Integrity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {INTEGRATIONS.slice(0, 4).map(int => {
              const connected = connections[int.id]?.connected
              return (
                <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'var(--bg-glass)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 22 }}>{int.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{int.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{connected ? 'Handshake Secure' : 'Offline'}</div>
                  </div>
                  <div className={`status-dot ${connected ? 'ok' : 'idle'}`} />
                </div>
              )
            })}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/connectors')}>Manage Access →</button>
          </div>
        </div>
      </div>

      {/* BLAST Guide */}
      <div className="premium-card">
        <h2>🚀 The B.L.A.S.T. Framework</h2>
        <div className="grid-5" style={{ gap: 12, marginTop: 24 }}>
          {[
            { letter: 'B', name: 'Blueprint',  desc: 'Schema Vision', color: '#6366f1' },
            { letter: 'L', name: 'Link',        desc: 'Core Connectivity', color: '#22d3ee' },
            { letter: 'A', name: 'Architect',   desc: 'Signal Extraction', color: '#10b981' },
            { letter: 'S', name: 'Stylize',     desc: 'AI Orchestration', color: '#f59e0b' },
            { letter: 'T', name: 'Trigger',     desc: 'System Deployment', color: '#ec4899' },
          ].map(step => (
            <div key={step.letter} className="premium-metric" style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
              <div style={{ width: 44, height: 44, background: step.color + '20', color: step.color, border: `2px solid ${step.color}40`, borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>
                {step.letter}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{step.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
