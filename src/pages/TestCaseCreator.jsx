import { useState, useEffect } from 'react'

export default function TestCaseCreator() {
  const [inputType, setInputType] = useState('jira') // 'jira' or 'manual'
  const [jiraId, setJiraId] = useState('')
  const [manualText, setManualText] = useState('')
  const [story, setStory] = useState(null)

  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [testCases, setTestCases] = useState(null)
  const [error, setError] = useState(null)

  // Clear states on unmount
  useEffect(() => {
    return () => {
      setStory(null)
      setTestCases(null)
    }
  }, [])

  const fetchJira = async () => {
    if (!jiraId.trim()) return
    setFetching(true); setError(null); setStory(null); setTestCases(null);

    try {
      const connections = JSON.parse(localStorage.getItem('connections') || '{}')
      const jiraConf = connections.jira || {}
      if (!jiraConf.baseUrl || !jiraConf.email || !jiraConf.apiToken) {
        throw new Error('Jira is not configured. Go to Integrations to set it up.')
      }

      const resp = await fetch(`/api/jira/fetch?id=${jiraId}`, {
        headers: {
          'x-jira-url': jiraConf.baseUrl,
          'x-jira-email': jiraConf.email,
          'x-jira-token': jiraConf.apiToken
        }
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Failed to fetch Jira issue')
      
      setStory(data.story)
    } catch (e) {
      setError(e.message)
    } finally {
      setFetching(false)
    }
  }

  const loadManual = () => {
    if (!manualText.trim()) return
    setError(null)
    setTestCases(null)
    setStory({
      id: 'MANUAL-1',
      title: 'Manual Requirement',
      description: manualText,
      acceptance_criteria: [],
      priority: 'N/A',
      type: 'Requirement'
    })
  }

  const generateCases = async () => {
    if (!story) {
      setError('Please provide a user story first.')
      return
    }
    setGenerating(true); setError(null); setTestCases(null);

    try {
      const connections = JSON.parse(localStorage.getItem('connections') || '{}')
      const llmConfig = connections.llm || {}

      const resp = await fetch('/api/generate/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          settings: {
            llmProvider: llmConfig.provider || 'openai',
            apiKey: llmConfig.apiKey,
            ollamaUrl: llmConfig.ollamaUrl,
            ollamaModel: llmConfig.ollamaModel,
            groqModel: llmConfig.groqModel,
            geminiModel: llmConfig.geminiModel,
            lmStudioUrl: llmConfig.lmStudioUrl,
            lmStudioModel: llmConfig.lmStudioModel
          }
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Test case generation failed')

      setTestCases(data.testCases)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb"><span>Home</span><span className="sep">/</span><span>Create Cases</span></div>
        <h1>🧪 Dedicated Test Case Generator</h1>
        <p>Generate precise, executable Functional & Non-Functional API/Web test cases directly into a tabular Jira format.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>❌ {error}</div>}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left column: Input */}
        <div className="card">
          <div className="card-header">
            <h3>Input Requirement</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className={`btn btn-sm ${inputType === 'jira' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputType('jira')}
              >
                Jira ID
              </button>
              <button 
                className={`btn btn-sm ${inputType === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputType('manual')}
              >
                Paste Context
              </button>
            </div>
          </div>
          
          <div className="card-body">
            {inputType === 'jira' ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. AUTH-123" 
                  value={jiraId}
                  onChange={e => setJiraId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchJira()}
                />
                <button className={`btn btn-primary ${fetching ? 'btn-loading' : ''}`} onClick={fetchJira} disabled={fetching || !jiraId.trim()}>
                  {fetching ? '' : 'Fetch'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea 
                  className="form-input" 
                  placeholder="Paste your user story, acceptance criteria, or requirements here..."
                  style={{ minHeight: 120, resize: 'vertical' }}
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
                <button className="btn btn-primary" onClick={loadManual} disabled={!manualText.trim()}>
                  Load Requirement
                </button>
              </div>
            )}

            {story && (
              <div style={{ marginTop: 24, padding: 16, backgroundColor: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h4 style={{ margin: 0 }}>Loaded Context</h4>
                  <span className="badge badge-info">{story.id}</span>
                </div>
                {story.title && <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>{story.title}</div>}
                
                <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {story.description || 'No description provided.'}
                </div>

                <button
                  className={`btn btn-primary ${generating ? 'btn-loading' : ''}`}
                  style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
                  onClick={generateCases}
                  disabled={generating}
                >
                  {generating ? '' : '🤖 Generate Jira Tabular Test Cases'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Animation or blank space if not generating */}
        <div>
          {generating && (
            <div className="card">
              <div className="generating-animation">
                <div className="spinner spinner-lg" />
                <div className="label">🤖 AI processing requirements…</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Extracting facts, tracing Acceptance Criteria, and generating tabular Jira artifacts.
                </div>
              </div>
            </div>
          )}

          {!generating && !testCases && !error && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🧪</div>
                <h3>Ready to Generate</h3>
                <p>Load a requirement and hit generate to construct your Jira test case table.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full width bottom area for the table! */}
      {testCases && !generating && (
        <div style={{ marginTop: 24, animation: 'slideUp 0.3s ease' }}>
          
          {/* Coverage Report Card */}
          {story?.acceptance_criteria?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>🎯 AC Coverage Matrix</h3>
              </div>
              <div className="card-body" style={{ padding: '0 20px 20px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {story.acceptance_criteria.map((ac, idx) => {
                    const acNum = idx + 1;
                    const coveringCases = testCases.filter(tc => tc.ac_traced?.includes(acNum));
                    const isCovered = coveringCases.length > 0;
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: 12, 
                        padding: 12, backgroundColor: 'var(--bg-elevated)', 
                        borderRadius: 6, borderLeft: `4px solid ${isCovered ? 'var(--success)' : 'var(--error)'}`
                      }}>
                        <div style={{ fontSize: 18, marginTop: 2 }}>{isCovered ? '✅' : '⚠️'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>AC #{acNum}</div>
                          <div style={{ fontSize: 14 }}>{ac}</div>
                          {isCovered ? (
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Covered by:</span>
                              {coveringCases.map(tc => (
                                <span key={tc.id} className="badge badge-info">{tc.id}</span>
                              ))}
                            </div>
                          ) : (
                            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--error)' }}>
                              Not covered by any test case.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Generated Test Cases (Jira Tabular Format)</h3>
              <span className="badge badge-success">{testCases.length} Cases Generated</span>
            </div>
          
          <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>ID</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', minWidth: 200 }}>Title & Preconditions</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', minWidth: 300 }}>Test Steps (Action & Input)</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', minWidth: 250 }}>Expected Result</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {testCases.map((tc, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 'bold', color: 'var(--primary-light)' }}>
                      {tc.id}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{tc.title}</div>
                      {tc.preconditions && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px', background: 'var(--bg-elevated)', borderRadius: 4 }}>
                          <strong style={{ display: 'block', marginBottom: 2 }}>Preconditions:</strong>
                          {tc.preconditions}
                        </div>
                      )}
                      {tc.type && <span className="badge badge-info" style={{ marginTop: 8, display: 'inline-block' }}>{tc.type}</span>}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <ol style={{ margin: 0, paddingLeft: 16, color: 'var(--text-primary)' }}>
                        {tc.steps?.map((step, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{step}</li>
                        ))}
                      </ol>
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>
                      {tc.expected}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span className={`badge priority-${(tc.priority || '').toLowerCase()}`}>{tc.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
