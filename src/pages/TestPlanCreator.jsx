import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import { useConnections } from '../hooks/useConnections'
import { generateService } from '../services/api'

const SETTINGS_DEFAULTS = {
  projectName:  '',
  environment:  'QA, Staging, Production',
  platform:     'Web Application (Chrome, Firefox, Safari, Edge)',
  testingTypes: 'Functional, Regression, UI/UX, API',
  team:         'QA Team',
}

export default function TestPlanCreator() {
  const navigate = useNavigate()
  const { getLLMConfig } = useConnections()
  const [story, setStory]       = useState(null)
  const [generating, setGenerating] = useState(false)
  const [testPlan, setTestPlan] = useState('')
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
    setGenerating(true); setError(null); setTestPlan('');

    try {
      const llmConfig = getLLMConfig()
      const resp = await generateService.testPlan(story, {
        ...settings,
        projectName: settings.projectName || story.id,
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
      setTestPlan(data.testPlan)
      setActiveTab('preview')

      // Save to history
      const history = JSON.parse(localStorage.getItem('testPlanHistory') || '[]')
      history.unshift({ story, testPlan: data.testPlan, settings, createdAt: new Date().toISOString() })
      localStorage.setItem('testPlanHistory', JSON.stringify(history.slice(0, 50)))
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setGenerating(false)
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

              <button
                className={`btn btn-primary ${generating ? 'btn-loading' : ''}`}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={generate}
                disabled={generating}
              >
                {generating ? '' : '📋 Generate Test Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div>
          {generating && (
            <div className="card">
              <div className="generating-animation">
                <div className="spinner spinner-lg" />
                <div className="label">🤖 AI is extracting BLAST context…</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Building all 12 sections: Objective, Scope, Test Environments, Strategy...
                </div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">❌ {error}</div>}

          {!generating && !testPlan && !error && (
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

        </div>
      </div>
    </div>
  )
}
