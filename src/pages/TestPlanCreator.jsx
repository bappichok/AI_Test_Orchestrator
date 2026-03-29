import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { marked } from 'marked'

const SETTINGS_DEFAULTS = {
  projectName:  '',
  environment:  'QA, Staging, Production',
  platform:     'Web Application (Chrome, Firefox, Safari, Edge)',
  testingTypes: 'Functional, Regression, UI/UX, API',
  team:         'QA Team',
}

export default function TestPlanCreator() {
  const navigate = useNavigate()
  const [story, setStory]       = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatingCases, setGeneratingCases] = useState(false)
  const [testPlan, setTestPlan] = useState('')
  const [testCases, setTestCases] = useState(null)
  const [error, setError]       = useState(null)
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS)
  const [activeTab, setActiveTab] = useState('preview')
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingStory')
    if (pending) {
      setStory(JSON.parse(pending))
      sessionStorage.removeItem('pendingStory')
    }
  }, [])

  const generate = async () => {
    if (!story) return
    setGenerating(true); setError(null); setTestPlan(''); setTestCases(null);

    try {
      const connections = JSON.parse(localStorage.getItem('connections') || '{}')
      const llmConfig = connections.llm || {}

      const resp = await fetch('/api/generate/test-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          projectName: settings.projectName || story.id,
          settings: {
            ...settings,
            llmProvider: llmConfig.provider || 'openai',
            apiKey: llmConfig.apiKey,
            ollamaUrl: llmConfig.ollamaUrl,
            ollamaModel: llmConfig.ollamaModel,
            groqModel: llmConfig.groqModel,
          }
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Generation failed')

      setTestPlan(data.testPlan)
      setActiveTab('preview')

      // Save to history
      const history = JSON.parse(localStorage.getItem('testPlanHistory') || '[]')
      history.unshift({ story, testPlan: data.testPlan, settings, createdAt: new Date().toISOString() })
      localStorage.setItem('testPlanHistory', JSON.stringify(history.slice(0, 50)))
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const generateCases = async () => {
    if (!story) return
    setGeneratingCases(true); setError(null); setTestPlan(''); setTestCases(null);

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
          }
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Test case generation failed')

      setTestCases(data.testCases)
      // Save test cases history optionally
    } catch (e) {
      setError(e.message)
    } finally {
      setGeneratingCases(false)
    }
  }

  const exportDocx = async () => {
    try {
      const resp = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: testPlan, title: `TestPlan-${story?.id || 'doc'}` })
      })
      if (!resp.ok) throw new Error('Export failed')
      
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TestPlan-${story?.id || 'plan'}-${Date.now()}.docx`
      a.click()
      const count = parseInt(localStorage.getItem('exportCount') || '0') + 1
      localStorage.setItem('exportCount', count)
    } catch (e) {
      alert('Failed to export DOCX')
    }
  }

  const exportMarkdown = () => {
    const blob = new Blob([testPlan], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TestPlan-${story?.id || 'plan'}-${Date.now()}.md`
    a.click()
    const count = parseInt(localStorage.getItem('exportCount') || '0') + 1
    localStorage.setItem('exportCount', count)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testPlan)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setSetting = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

  if (!story) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="page-header">
          <h1>📋 Test Plan Creator</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No story loaded</div>
          <div className="empty-desc">Fetch a story first, then come here to generate your test plan.</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/fetch')}>
            🔍 Fetch a Story
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb">
          <span>Home</span><span className="sep">/</span>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/fetch')}>Fetch Story</span>
          <span className="sep">/</span><span>Create Plan</span>
        </div>
        <h1>📋 Create Test Plan</h1>
        <p>Review the extracted story signals and generate a BLAST-structured test plan using AI.</p>
      </div>

      <div className="split-layout">
        {/* Left: Story + Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Story summary */}
          <div className="card">
            <div className="card-header">
              <h3>📌 Story</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/fetch')}>Change →</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary-light)', fontWeight: 600 }}>{story.id}</span>
                <span className={`badge priority-${story.priority?.toLowerCase()}`}>{story.priority}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3 }}>{story.title}</div>
              {story.flags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {story.flags.map(f => <span key={f} className="badge badge-warning">⚠ {f}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Plan Settings */}
          <div className="card">
            <div className="card-header"><h3>⚙️ Plan Settings</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'projectName',  label: 'Project Name',     placeholder: story.id + ' Features' },
                { key: 'environment',  label: 'Test Environments', placeholder: 'QA, Staging, Production' },
                { key: 'platform',     label: 'Platform / Browsers', placeholder: 'Web App – Chrome, Firefox…' },
                { key: 'testingTypes', label: 'Testing Types',    placeholder: 'Functional, Regression…' },
                { key: 'team',         label: 'Team Name',         placeholder: 'QA Team' },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={f.placeholder}
                    value={settings[f.key]}
                    onChange={e => setSetting(f.key, e.target.value)}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className={`btn btn-primary ${generating ? 'btn-loading' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={generate}
                  disabled={generating || generatingCases}
                >
                  {generating ? '' : '📋 Generate Plan'}
                </button>
                <button
                  className={`btn btn-secondary ${generatingCases ? 'btn-loading' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={generateCases}
                  disabled={generating || generatingCases}
                >
                  {generatingCases ? '' : '🧪 Generate Cases'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div>
          {(generating || generatingCases) && (
            <div className="card">
              <div className="generating-animation">
                <div className="spinner spinner-lg" />
                <div className="label">🤖 AI is extracting BLAST context…</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {generating ? 'Building all 12 sections: Objective, Scope, Test Environments, Strategy...' : 'Applying strict Anti-Hallucination rules. Creating steps, preconditions, and observable expected results...'}
                </div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">❌ {error}</div>}

          {!generating && !generatingCases && !testPlan && !testCases && !error && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <div className="empty-title">Ready to Generate</div>
                <div className="empty-desc">Configure your plan settings on the left and click "Generate Test Plan" to create a BLAST-structured QA test plan.</div>
              </div>
            </div>
          )}

          {testPlan && (
            <div className="test-plan-preview" style={{ animation: 'slideUp 0.3s ease' }}>
              <div className="test-plan-toolbar">
                <div className="tabs" style={{ border: 'none', margin: 0 }}>
                  {['preview', 'markdown'].map(t => (
                    <button
                      key={t}
                      className={`tab ${activeTab === t ? 'active' : ''}`}
                      onClick={() => setActiveTab(t)}
                    >
                      {t === 'preview' ? '👁 Preview' : '📝 Markdown'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={exportDocx}>
                    📥 DOCX
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={exportMarkdown}>
                    📝 MD
                  </button>
                </div>
              </div>

              {activeTab === 'preview' ? (
                <div className="test-plan-content" dangerouslySetInnerHTML={{ __html: marked.parse(testPlan) }} />
              ) : (
                <div className="test-plan-content">
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {testPlan}
                  </pre>
                </div>
              )}
            </div>
          )}

          {testCases && !testPlan && (
            <div style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card-header" style={{ background: 'var(--bg-card)', borderRadius: 12 }}>
                <h3 style={{ margin: 0, padding: 4 }}>🧪 Generated Test Cases</h3>
              </div>
              {testCases.map((tc, idx) => (
                <div key={tc.id || idx} className="card" style={{ padding: 18, borderLeft: '4px solid var(--primary-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{tc.id}</span>
                      <span className={`badge priority-${(tc.priority || '').toLowerCase()}`}>{tc.priority}</span>
                      {tc.type && <span className="badge badge-info">{tc.type}</span>}
                    </div>
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 16 }}>{tc.title}</h4>
                  
                  {tc.preconditions && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                      <strong>Preconditions:</strong> {tc.preconditions}
                    </div>
                  )}

                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>Steps:</div>
                  <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                    {tc.steps?.map((step, i) => <li key={i} style={{ marginBottom: 6 }}>{step}</li>)}
                  </ol>

                  <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(79, 70, 229, 0.08)', borderRadius: 8, fontSize: 14, border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                    <strong style={{ color: 'var(--primary-light)' }}>Expected Result:</strong> {tc.expected}
                  </div>

                  {tc.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      {tc.tags.map(t => <span key={t} className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>#{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
