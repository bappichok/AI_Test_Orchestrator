import { useState, useEffect } from 'react'
import { useConnections } from '../hooks/useConnections'
import { jiraService, generateService } from '../services/api'
import { useToast } from '../components/Toast'
import StoryCard from '../components/StoryCard.jsx'

const TestCaseCard = ({ tc, idx }) => (
  <div className="card test-case-card" style={{ animation: `fadeIn 0.3s ease forwards ${idx * 0.05}s`, opacity: 0 }}>
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
          <span key={tag} className="badge badge-info" style={{ fontSize: '10px' }}>{tag}</span>
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
)

export default function TestCaseCreator() {
  const { connections, isConnected, getLLMConfig } = useConnections()
  const { addToast } = useToast()
  
  const [inputType, setInputType] = useState('jira') 
  const [jiraId, setJiraId] = useState('')
  const [manualText, setManualText] = useState('')
  const [story, setStory] = useState(null)

  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [testCases, setTestCases] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedStory = localStorage.getItem('currentStory')
    const storedTests = localStorage.getItem('generatedTestCases')
    if (storedStory) {
      try {
        setStory(JSON.parse(storedStory))
      } catch (e) {
        console.error('Failed to load story from localStorage:', e)
      }
    }
    if (storedTests) {
      try {
        setTestCases(JSON.parse(storedTests))
      } catch (e) {}
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
      localStorage.setItem('currentStory', JSON.stringify(resp.data.story))
      addToast(`Successfully loaded ${jiraId}`, 'success')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      addToast('Failed to fetch Jira story', 'error')
    } finally {
      setFetching(false)
    }
  }

  const loadManual = () => {
    if (!manualText.trim()) return
    setError(null)
    setTestCases(null)
    const mockManualStory = {
      id: 'MANUAL-1',
      title: 'Manual Requirement',
      description: manualText,
      acceptance_criteria: [],
      priority: 'Medium',
      type: 'Requirement'
    }
    setStory(mockManualStory)
    localStorage.setItem('currentStory', JSON.stringify(mockManualStory))
    addToast('Manual requirements loaded', 'success')
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
      
      // Save to history
      const history = JSON.parse(localStorage.getItem('testCaseHistory') || '[]')
      history.unshift({ 
        story, 
        testCases: data.testCases, 
        createdAt: new Date().toISOString() 
      })
      localStorage.setItem('testCaseHistory', JSON.stringify(history.slice(0, 50)))

      addToast(`Generated ${data.testCases.length} test cases!`, 'success')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      addToast('Failed to generate test cases', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const exportJson = () => {
    if (!testCases) return;
    const blob = new Blob([JSON.stringify(testCases, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${story.id}.json`;
    a.click();
    addToast('JSON exported successfully', 'success')
  }

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            🧪 TEST ARCHITECTURE
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Test Case Creator</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Automatically extract and write mathematically precise testing sequences from ambiguous requirements.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      <div className="content-grid">
        {/* Left column: Input */}
        <div className="premium-card">
          <h2>Input Requirement</h2>
          
          <div className="form-group">
            <label className="form-label">Source Type</label>
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
                <label className="form-label">Jira Issue ID</label>
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
                <label className="form-label">Paste Your Requirement</label>
                <textarea 
                  className="form-textarea" 
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

          <StoryCard story={story} compact />

          {story && (
            <div className="form-group" style={{ marginTop: 20 }}>
              <button
                className="btn btn-success"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={generateCases}
                disabled={generating || !story}
              >
                {generating ? <span className="spinner" style={{width: 16, height: 16, borderTopColor: '#fff', marginRight: 8}} /> : '🤖'}
                {generating ? 'Generating Test Cases...' : 'Generate Test Cases'}
              </button>
            </div>
          )}
        </div>

        {/* Right column: Test Cases Display */}
        {testCases && testCases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="premium-card" style={{ padding: '24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, padding: 0 }}>Generated Logic Output ({testCases.length})</h2>
                <button className="btn btn-secondary btn-sm" onClick={exportJson}>
                  📥 Export JSON
                </button>
              </div>
            </div>

            {testCases.map((tc, idx) => (
              <TestCaseCard key={idx} tc={tc} idx={idx} />
            ))}
          </div>
        )}

        {(!testCases || testCases.length === 0) && (
          <div className="premium-card">
            <div className="empty-state">
              <div className="empty-icon">🧪</div>
              <h3 className="empty-title">Ready to Generate</h3>
              <p className="empty-desc">Load a requirement and hit generate to automatically create robust test cases powered by AI.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
