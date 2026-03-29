import { useState, useEffect } from 'react'
import { useConnections } from '../hooks/useConnections'
import { jiraService, generateService } from '../services/api'

export default function TestCaseCreator() {
  const { connections, isConnected, getLLMConfig } = useConnections()
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
    // Check if story was passed from StoryFetcher
    const storedStory = localStorage.getItem('currentStory')
    if (storedStory) {
      try {
        setStory(JSON.parse(storedStory))
      } catch (e) {
        console.error('Failed to load story from localStorage:', e)
      }
    }

    return () => {
      setStory(null)
      setTestCases(null)
    }
  }, [])

  const fetchJira = async () => {
    if (!jiraId.trim()) return
    setFetching(true); setError(null); setStory(null);

    try {
      if (!isConnected('jira')) {
        throw new Error('Jira is not configured. Go to Integrations to set it up.')
      }

      const jiraConf = connections.jira || {}
      const resp = await jiraService.fetch(jiraId, jiraConf)
      setStory(resp.data.story)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
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
      const llmConfig = getLLMConfig()
      const resp = await generateService.testCases(story, {
        llmProvider: llmConfig.provider || 'openai',
        apiKey: llmConfig.apiKey,
        ollamaUrl: llmConfig.ollamaUrl,
        ollamaModel: llmConfig.ollamaModel,
        groqModel: llmConfig.groqModel,
        geminiModel: llmConfig.geminiModel,
        lmStudioUrl: llmConfig.lmStudioUrl,
        lmStudioModel: llmConfig.lmStudioModel
      })
      
      const data = resp.data
      if (!data.testCases || !Array.isArray(data.testCases) || data.testCases.length === 0) {
        throw new Error('API returned no test cases')
      }

      setTestCases(data.testCases)
      localStorage.setItem('generatedTestCases', JSON.stringify(data.testCases))
      localStorage.setItem('currentStory', JSON.stringify(story))
      console.log('✅ Test cases and story saved to localStorage:', data.testCases.length, 'cases')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🧪 Test Case Generator</h1>
        <p>Generate precise, executable test cases from stories and requirements</p>
      </div>

      {error && (
        <div className="card error-box">
          ❌ {error}
        </div>
      )}

      <div className="content-grid">
        {/* Left column: Input */}
        <div className="card">
          <h2>Input Requirement</h2>
          
          <div className="form-group">
            <label>Source Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className={`btn ${inputType === 'jira' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputType('jira')}
              >
                Jira ID
              </button>
              <button 
                className={`btn ${inputType === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputType('manual')}
              >
                Paste Context
              </button>
            </div>
          </div>
          
          <div className="form-group">
            {inputType === 'jira' ? (
              <>
                <label>Jira Issue ID</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. AUTH-123" 
                    value={jiraId}
                    onChange={e => setJiraId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchJira()}
                  />
                  <button className={`btn btn-primary`} onClick={fetchJira} disabled={fetching || !jiraId.trim()}>
                    {fetching ? '⏳ Fetching...' : '🔍 Fetch'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label>Paste Your Requirement</label>
                <textarea 
                  className="form-input" 
                  placeholder="Paste your user story, acceptance criteria, or requirements here..."
                  style={{ minHeight: 120, resize: 'vertical' }}
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
                <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={loadManual} disabled={!manualText.trim()}>
                  📝 Load Requirement
                </button>
              </>
            )}
          </div>

          {story && (
            <div className="info-box">
              <strong>✅ Story Loaded</strong>
              <div style={{ marginTop: '12px', fontSize: '14px' }}>
                <div><strong>ID:</strong> {story.id}</div>
                <div><strong>Title:</strong> {story.title}</div>
                <div><strong>Type:</strong> {story.type}</div>
                <div><strong>Priority:</strong> {story.priority}</div>
                {story.description && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <strong>Description:</strong>
                    <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {story.description}
                    </div>
                  </div>
                )}
                {story.acceptance_criteria?.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <strong>Acceptance Criteria ({story.acceptance_criteria.length}):</strong>
                    <ul style={{ margin: '6px 0 0 20px', fontSize: '13px' }}>
                      {story.acceptance_criteria.map((ac, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{ac}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {story.attachments?.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <strong>📎 Attachments ({story.attachments.length}):</strong>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {story.attachments.map((att, i) => (
                        <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{att.mimeType?.includes('image') ? '🖼️' : '📄'}</span>
                          <span>{att.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({(att.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {story && (
            <div className="form-group">
              <button
                className="btn btn-success"
                style={{ width: '100%' }}
                onClick={generateCases}
                disabled={generating || !story}
              >
                {generating ? '⏳ Generating...' : '🤖 Generate Test Cases'}
              </button>
            </div>
          )}
        </div>

        {/* Right column: Test Cases Display */}
        {testCases && testCases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Generated Test Cases ({testCases.length})</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const blob = new Blob([JSON.stringify(testCases, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `test-cases-${story.id}.json`;
                    a.click();
                  }}>📥 Export JSON</button>
                </div>
              </div>
            </div>

            {testCases.map((tc, idx) => (
              <div key={idx} className="card test-case-card" style={{ animation: `fadeIn 0.3s ease forwards ${idx * 0.05}s`, opacity: 0 }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="story-id" style={{ fontSize: '14px' }}>{tc.id || tc.ID || `TC-${idx + 1}`}</span>
                      <span className={`badge priority-${(tc.priority || 'Medium').toLowerCase()}`}>{tc.priority || 'Medium'}</span>
                      <span className="badge badge-muted">{tc.type || 'Functional'}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{tc.title || 'Test Case'}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '200px' }}>
                    {(tc.tags || []).map(tag => (
                      <span key={tag} className="tag" style={{ fontSize: '10px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <div className="story-section-label" style={{ color: 'var(--primary-light)' }}>Steps</div>
                      <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {(tc.steps || []).map((step, i) => (
                          <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <div className="story-section-label" style={{ color: 'var(--success)' }}>Expected Results</div>
                      <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: 'var(--text-secondary)', listStyleType: 'none' }}>
                        {(tc.expected || []).map((exp, i) => (
                          <li key={i} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: 'var(--success)' }}>✓</span>
                            <span>{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {tc.ac_traced && tc.ac_traced.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Traces to AC:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {tc.ac_traced.map(ac => (
                          <span key={ac} className="badge badge-info" style={{ fontSize: '10px' }}>AC-{ac}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!testCases && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🧪</div>
              <h3>Ready to Generate</h3>
              <p>Load a requirement and hit generate to create test cases.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
