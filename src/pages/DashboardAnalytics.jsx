import { useState, useEffect } from 'react'

export default function DashboardAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [testCases, setTestCases] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only call once
    if (!analytics && !loading) {
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
        setError('❌ No test cases found. Generate test cases in the Create Cases section first.')
        setLoading(false)
        return
      }

      const testCasesData = JSON.parse(stored)
      setTestCases(testCasesData)

      // Generate analytics
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
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="page-container"><p>⏳ Loading dashboard...</p></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 QA Dashboard</h1>
        <p>Test case coverage and analytics</p>
        <button onClick={loadDashboard} className="btn btn-secondary">🔄 Refresh</button>
      </div>

      {error && (
        <div className="card error-box">
          ❌ {error}
        </div>
      )}

      {analytics && (
        <>
          {/* ── Summary Section ──────────────────────────── */}
          <div className="content-grid">
            <div className="card">
              <h2>📈 Test Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="metric-box">
                  <div className="metric-label">Total Test Cases</div>
                  <div className="metric-value">{analytics.summary.total}</div>
                </div>

                <div className="metric-box">
                  <div className="metric-label">Stories Covered</div>
                  <div className="metric-value">{analytics.coverage.stories_covered}</div>
                </div>

                <div className="metric-box">
                  <div className="metric-label">Coverage %</div>
                  <div className="metric-value">{Number(analytics.coverage.coverage_percent).toFixed(1)}%</div>
                </div>

                <div className="metric-box">
                  <div className="metric-label">Avg per Story</div>
                  <div className="metric-value">{Number(analytics.coverage.avg_cases_per_story).toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* ── Priority Breakdown ──────────────────────── */}
            <div className="card">
              <h2>🎯 By Priority</h2>
              <div style={{ marginTop: '16px' }}>
                <PriorityBar label="Critical" value={analytics.summary.by_priority.critical} color="#ff4444" />
                <PriorityBar label="High" value={analytics.summary.by_priority.high} color="#ff9944" />
                <PriorityBar label="Medium" value={analytics.summary.by_priority.medium} color="#ffdd44" />
                <PriorityBar label="Low" value={analytics.summary.by_priority.low} color="#44ff44" />
              </div>
            </div>

            {/* ── Type Breakdown ──────────────────────────── */}
            <div className="card">
              <h2>🧪 By Test Type</h2>
              <div style={{ marginTop: '16px' }}>
                <TypeBadge label="Functional" value={analytics.summary.by_type.functional} />
                <TypeBadge label="Negative" value={analytics.summary.by_type.negative} />
                <TypeBadge label="Boundary" value={analytics.summary.by_type.boundary} />
                <TypeBadge label="Integration" value={analytics.summary.by_type.integration} />
                <TypeBadge label="Security" value={analytics.summary.by_type.security} />
                <TypeBadge label="UI" value={analytics.summary.by_type.ui} />
              </div>
            </div>
          </div>

          {/* ── Gaps Section ──────────────────────────── */}
          {analytics.gaps && analytics.gaps.length > 0 && (
            <div className="card">
              <h2>⚠️ Coverage Gaps</h2>
              <div style={{ marginTop: '16px' }}>
                {analytics.gaps.map((gap, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: 'rgba(255, 100, 100, 0.1)',
                    borderLeft: '4px solid #ff6464',
                    borderRadius: '4px'
                  }}>
                    <strong>{gap.story_id}</strong>: {gap.issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Quality Flags Section ──────────────────────────── */}
          {analytics.flags && analytics.flags.length > 0 && (
            <div className="card">
              <h2>🚩 Quality Issues</h2>
              <div style={{ marginTop: '16px' }}>
                {analytics.flags.map((flag, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: 'rgba(255, 200, 0, 0.1)',
                    borderLeft: '4px solid #ffc800',
                    borderRadius: '4px'
                  }}>
                    <strong>{flag.id || flag.test_id}</strong>: {flag.issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Test Cases List ──────────────────────────── */}
          {testCases && (
            <div className="card">
              <h2>📋 Test Cases List</h2>
              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #444' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Priority</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.slice(0, 20).map((tc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px' }}><code>{tc.id}</code></td>
                        <td style={{ padding: '12px' }}>{tc.title}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: getPriorityColor(tc.priority)
                          }}>
                            {tc.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{tc.type}</td>
                        <td style={{ padding: '12px' }}>✅ Ready</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {testCases.length > 20 && (
                  <p style={{ marginTop: '12px', color: '#888' }}>
                    ... and {testCases.length - 20} more test cases
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!analytics && !error && !loading && (
        <div className="card">
          <p>No analytics data. Generate test cases first in the <strong>Create Cases</strong> section.</p>
        </div>
      )}
    </div>
  )
}

function PriorityBar({ label, value, color }) {
  const maxValue = 10
  const percentage = Math.min((value / maxValue) * 100, 100)
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{value}</span>
      </div>
      <div style={{ width: '100%', height: '24px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

function TypeBadge({ label, value }) {
  if (value === 0) return null
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 12px',
      marginRight: '8px',
      marginBottom: '8px',
      backgroundColor: '#4f46e5',
      color: 'white',
      borderRadius: '20px',
      fontSize: '12px'
    }}>
      {label}: {value}
    </span>
  )
}

function getPriorityColor(priority) {
  const colors = {
    'critical': 'rgba(255, 68, 68, 0.2)',
    'high': 'rgba(255, 153, 68, 0.2)',
    'medium': 'rgba(255, 221, 68, 0.2)',
    'low': 'rgba(68, 255, 68, 0.2)'
  }
  return colors[priority?.toLowerCase()] || 'rgba(150, 150, 150, 0.2)'
}
