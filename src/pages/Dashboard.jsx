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
      <div className="dashboard-hero" style={{ position: 'relative', zIndex: 1, paddingBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', letterSpacing: '1.2px', border: '1px solid rgba(255,255,255,0.3)' }}>
              🚀 B.L.A.S.T
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>AI Test Orchestrator</span>
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 10px 30px rgba(0,0,0,0.3)', lineHeight: '1.1', maxWidth: '700px' }}>Test Orchestration Platform</h1>
          <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '650px', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>Build deterministic, self-healing automation powered by AI. Blueprint • Link • Architect • Stylize • Trigger.</p>
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
      <div className="grid-4" style={{ marginBottom: 48 }}>
        {STATS_CONFIG.map(s => (
          <div key={s.key} className="premium-metric">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
              <span style={{ fontSize: 20, background: s.color + '25', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', margin: '12px 0 0 0', letterSpacing: '-1px' }}>{stats[s.key]}</div>
            <div style={{ height: 6, width: '100%', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 3, overflow: 'hidden', marginTop: '8px' }}>
              <div style={{ height: '100%', width: stats[s.key] > 0 ? '75%' : '0%', background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: `0 0 16px ${s.color}40` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid" style={{ marginBottom: 48 }}>
        {/* Recent Plans */}
        <div className="premium-card">
          <h2>📁 Execution History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {history.length > 0 ? (
              history.map((h, i) => (
                <div key={i} className="nav-item" onClick={() => {
                  sessionStorage.setItem('viewHistoryPlan', JSON.stringify(h))
                  navigate('/history')
                }} style={{ padding: '18px 20px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', cursor: 'pointer', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary-light)', letterSpacing: '-0.3px' }}>{h.story?.id || 'Manual'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
                    {h.story?.title || 'Generated Plan'}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>No local history compiled yet.</div>
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
