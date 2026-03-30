import { useState, useEffect, useRef } from 'react'
import { useToast } from '../components/Toast'

const MetricGridBox = ({ label, value, icon, gradient, delay }) => (
// ... Rest of the file
  <div className="premium-metric" style={{ animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s backwards` }}>
    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', background: gradient, filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%', zIndex: '-1' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>{label}</div>
      <div style={{ fontSize: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '18px', boxShadow: '0 8px 16px rgba(0,0,0,0.06)' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '56px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-2px', marginTop: 'auto', lineHeight: '1' }}>{value}</div>
  </div>
);

const PriorityGauge = ({ label, value, color, delay }) => {
  const maxValue = 10
  const percentage = Math.min((value / maxValue) * 100, 100)
  return (
    <div style={{ marginBottom: '32px', animation: `fadeIn 0.6s ease ${delay}s backwards` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '16px', fontWeight: '800' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: color, background: `${color}15`, padding: '4px 16px', borderRadius: '12px', border: `1px solid ${color}30`, boxShadow: `0 4px 12px ${color}15` }}>{value} Incidents</span>
      </div>
      <div className="priority-bar-container">
        <div className="priority-bar-fill" style={{
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          boxShadow: `0 0 20px ${color}60`,
          transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
        }} />
      </div>
    </div>
  )
}

const TagBadge = ({ label, value }) => {
  if (value === 0) return null
  return (
    <div className="tag-pill" style={{ margin: '0 12px 12px 0' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '4px 12px', borderRadius: '100px', border: '1px solid var(--border)' }}>{value}</span>
    </div>
  )
}

function getPriorityColorSpec(priority) {
  const specs = {
    'critical': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    'high':     { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    'medium':   { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    'low':      { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
  }
  return specs[priority?.toLowerCase()] || { color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.12)' }
}

export default function DashboardAnalytics() {
  const { addToast } = useToast()
  
  const [analytics, setAnalytics] = useState(null)
  const [testCases, setTestCases] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!analytics && !loading && !hasFetched.current) {
      hasFetched.current = true
      loadDashboard()
    }
  }, [])

  const loadDashboard = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const stored = localStorage.getItem('generatedTestCases')
      if (!stored) {
        setError('No test cases found. Generate test cases in the Create Cases section first.')
        setLoading(false)
        return
      }

      const testCasesData = JSON.parse(stored)
      setTestCases(testCasesData)

      const connections = JSON.parse(localStorage.getItem('connections') || '{}')
      const llmConfig = connections.llm || {}

      const response = await fetch('/api/generate/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCases: testCasesData,
          llmSettings: {
            llmProvider: llmConfig.provider || 'openai',
            apiKey: llmConfig.apiKey,
            ollamaUrl: llmConfig.ollamaUrl,
            ollamaModel: llmConfig.ollamaModel,
            groqModel: llmConfig.groqModel,
            geminiModel: llmConfig.geminiModel,
            customUrl: llmConfig.customUrl,
            customModel: llmConfig.customModel
          }
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analytics generation failed')

      setAnalytics(data.analytics)
      addToast('Analytics refreshed successfully!', 'success')
    } catch (e) {
      setError(e.message)
      addToast('Failed to compile dashboard metrics', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !analytics) return (
    <div className="page-container" style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-lg" style={{ width: 64, height: 64, borderWidth: 6, margin: '0 auto' }}></div>
        <p style={{ marginTop: 32, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Compiling Matrix Engine...</p>
        <p style={{ color: 'var(--text-muted)' }}>Analyzing live coverage data via AI proxy</p>
      </div>
    </div>
  )

  return (
    <div className="page-container" style={{ padding: '0 16px' }}>

      {/* ── Stunning Hero Header ──────────────────────────── */}
      <div className="dashboard-hero">
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', letterSpacing: '1.2px', border: '1px solid rgba(255,255,255,0.3)' }}>
                  ✨ ANALYTICS
                </div>
              </div>
              <h1 style={{ fontSize: '44px', fontWeight: '900', letterSpacing: '-1.8px', margin: '0 0 8px 0', textShadow: '0 10px 30px rgba(0,0,0,0.3)', lineHeight: '1.1', maxWidth: '600px' }}>QA Analytics Engine</h1>
              <p style={{ fontSize: '16px', opacity: 0.92, maxWidth: '620px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Real-time coverage analysis, risk stratification, and AI-powered quality insights with traceability matrices.</p>
            </div>
            <button 
              onClick={loadDashboard} 
              disabled={loading}
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)', 
                color: '#4f46e5', 
                padding: '14px 32px', 
                borderRadius: '100px', 
                fontSize: '14px', 
                fontWeight: '800', 
                boxShadow: '0 12px 32px rgba(0,0,0,0.25)', 
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transform: loading ? 'scale(0.95)' : 'scale(1)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                marginTop: '2px'
              }} 
            >
              {loading ? '🔄 Compiling...' : '⚡ Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="premium-card" style={{ marginBottom: 40, background: 'rgba(239, 68, 68, 0.05)', borderLeft: '6px solid var(--danger)' }}>
          <h2 style={{ color: 'var(--danger)', margin: 0, fontSize: '20px' }}>⚠️ System Alert: {error}</h2>
        </div>
      )}

      {analytics && (
        <>
          {/* ── Summary Section ──────────────────────────── */}
          <div className="content-grid" style={{ marginBottom: 40 }}>
            <div className="premium-card">
              <h2>📈 Velocity Matrix</h2>
              <div className="grid-2" style={{ marginTop: '32px' }}>
                <MetricGridBox delay={0.1} icon="⚡" gradient="var(--primary)" label="Total Executions" value={analytics.summary.total} />
                <MetricGridBox delay={0.2} icon="🎯" gradient="var(--success)" label="Features Covered" value={analytics.coverage.stories_covered} />
                <MetricGridBox delay={0.3} icon="🛡" gradient="var(--info)" label="Traceability" value={`${Number(analytics.coverage.coverage_percent).toFixed(1)}%`} />
                <MetricGridBox delay={0.4} icon="🧬" gradient="var(--warning)" label="Avg Density" value={Number(analytics.coverage.avg_cases_per_story).toFixed(1)} />
              </div>
            </div>

            {/* ── Priority Breakdown ──────────────────────── */}
            <div className="premium-card">
              <h2>🎯 Risk Assessment Graph</h2>
              <div style={{ marginTop: '32px' }}>
                <PriorityGauge delay={0.1} label="Critical Vulnerability" value={analytics.summary.by_priority.critical} color="#ef4444" />
                <PriorityGauge delay={0.2} label="High Severity" value={analytics.summary.by_priority.high} color="#f59e0b" />
                <PriorityGauge delay={0.3} label="Medium Priority" value={analytics.summary.by_priority.medium} color="#3b82f6" />
                <PriorityGauge delay={0.4} label="Low Priority" value={analytics.summary.by_priority.low} color="#10b981" />
              </div>
            </div>

            {/* ── Type Breakdown ──────────────────────────── */}
            <div className="premium-card" style={{ gridColumn: '1 / -1' }}>
              <h2>🧪 Diagnostic Distribution</h2>
              <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap' }}>
                <TagBadge label="Functional Tests" value={analytics.summary.by_type.functional} />
                <TagBadge label="Negative Paths" value={analytics.summary.by_type.negative} />
                <TagBadge label="Boundary Analysis" value={analytics.summary.by_type.boundary} />
                <TagBadge label="Integration Layers" value={analytics.summary.by_type.integration} />
                <TagBadge label="Security Audits" value={analytics.summary.by_type.security} />
                <TagBadge label="UI Interfaces" value={analytics.summary.by_type.ui} />
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 40 }}>
            {/* ── Gaps Section ──────────────────────────── */}
            {analytics.gaps && analytics.gaps.length > 0 && (
              <div className="premium-card">
                <h2>⚠️ Coverage Deltas</h2>
                <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analytics.gaps.map((gap, idx) => (
                    <div key={idx} style={{
                      padding: '24px',
                      backgroundColor: 'rgba(239, 68, 68, 0.04)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderLeft: '4px solid var(--danger)',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{gap.story_id}</strong>
                        <span style={{ fontSize: '18px' }}>🔍</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>{gap.issue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Quality Flags Section ──────────────────────────── */}
            {analytics.flags && analytics.flags.length > 0 && (
              <div className="premium-card">
                <h2>🚩 Quality AI Discrepancies</h2>
                <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analytics.flags.map((flag, idx) => (
                    <div key={idx} style={{
                      padding: '24px',
                      backgroundColor: 'rgba(245, 158, 11, 0.04)',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                      borderLeft: '4px solid var(--warning)',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{flag.id || flag.test_id}</strong>
                        <span style={{ fontSize: '18px' }}>⚡</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>{flag.issue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Test Cases List ──────────────────────────── */}
          {testCases && (
            <div className="premium-card">
              <h2>📋 Live Indexed Coverage Manifest</h2>
              <div style={{ marginTop: '32px', overflowX: 'auto', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <table className="premium-table">
                  <thead style={{ background: 'var(--bg-elevated)' }}>
                    <tr>
                      <th>Identifier</th>
                      <th>Narrative Definition</th>
                      <th>Impact Tier</th>
                      <th>Execution Vector</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.slice(0, 20).map((tc, idx) => {
                      const priorityStyles = getPriorityColorSpec(tc.priority);
                      return (
                        <tr key={idx} style={{ transition: 'all 0.2s ease' }}>
                          <td style={{ color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{tc.id || tc.ID}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{tc.title}</td>
                          <td>
                            <span style={{
                              padding: '6px 16px',
                              borderRadius: '100px',
                              fontSize: '12px',
                              fontWeight: '800',
                              color: priorityStyles.color,
                              background: priorityStyles.bg,
                              textTransform: 'uppercase',
                              border: `1px solid ${priorityStyles.color}30`
                            }}>
                              {tc.priority}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{tc.type}</td>
                          <td style={{ color: 'var(--success)', fontWeight: '700' }}>● Synchronized</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {testCases.length > 20 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--bg-elevated)', fontWeight: '600' }}>
                    Displaying subset (20 of {testCases.length}) fully parsed executable vectors
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!analytics && !error && !loading && (
        <div className="premium-card" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', opacity: 0.5, marginBottom: '24px' }}>📊</div>
          <h3 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '16px' }}>Dashboard Engine Dormant</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>No analytics matrix injected. Execute your test generation pipeline within the <strong>Create Cases</strong> portal to populate this dashboard.</p>
        </div>
      )}
    </div>
  )
}
