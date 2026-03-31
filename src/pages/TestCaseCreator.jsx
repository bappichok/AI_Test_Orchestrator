import { useState, useEffect, useRef } from 'react'
import { useConnections } from '../hooks/useConnections'
import { jiraService, generateService } from '../services/api'
import { useToast } from '../components/Toast'
import StoryCard from '../components/StoryCard.jsx'

// ── Inline-editable Test Case Card ─────────────────────────────────
const TestCaseCard = ({ tc, idx, story, onUpdate, onRegenerate, onDelete, llmSettings }) => {
  const [editing, setEditing] = useState(tc._new || false)
  const [draft, setDraft] = useState(tc)
  const [regenerating, setRegenerating] = useState(false)

  const save = () => {
    const updated = {
      ...draft,
      steps: typeof draft.steps === 'string' ? draft.steps.split('\n').filter(Boolean) : draft.steps,
      expected: typeof draft.expected === 'string' ? draft.expected.split('\n').filter(Boolean) : draft.expected,
      tags: typeof draft.tags === 'string' ? draft.tags.split(',').map(t => t.trim()).filter(Boolean) : draft.tags,
      _new: false
    }
    onUpdate(idx, updated)
    setEditing(false)
  }

  const cancel = () => {
    if (tc._new) { onDelete(idx); return }
    setDraft(tc)
    setEditing(false)
  }

  const regen = async () => {
    setRegenerating(true)
    try {
      const resp = await generateService.singleCase(story, llmSettings, tc.id)
      onUpdate(idx, resp.data.testCase)
    } catch (e) {
      console.error('Regen failed', e)
    } finally {
      setRegenerating(false)
    }
  }

  const priorityColor = {
    Critical: 'priority-critical',
    High: 'priority-high',
    Medium: 'priority-medium',
    Low: 'priority-low'
  }

  if (editing) {
    return (
      <div className="card test-case-card" style={{ animation: 'fadeIn 0.2s ease', border: '1px solid var(--border-focus)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-light)' }}>✏️ Editing {draft.id || `TC-${idx+1}`}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" onClick={save}>💾 Save</button>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>✕ Cancel</button>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Title</label>
              <input className="form-input" value={draft.title || ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select className="form-select" value={draft.priority || 'Medium'} onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}>
                {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type</label>
              <input className="form-input" value={draft.type || ''} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))} placeholder="Functional" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" value={Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags || ''} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} placeholder="auth, negative, boundary" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Steps (one per line)</label>
              <textarea className="form-textarea" style={{ minHeight: 140 }}
                value={Array.isArray(draft.steps) ? draft.steps.join('\n') : draft.steps || ''}
                onChange={e => setDraft(d => ({ ...d, steps: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expected Results (one per line)</label>
              <textarea className="form-textarea" style={{ minHeight: 140 }}
                value={Array.isArray(draft.expected) ? draft.expected.join('\n') : draft.expected || ''}
                onChange={e => setDraft(d => ({ ...d, expected: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card test-case-card" style={{ animation: `fadeIn 0.3s ease forwards ${idx * 0.05}s`, opacity: 0 }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="story-id" style={{ fontSize: '14px' }}>{tc.id || `TC-${idx + 1}`}</span>
            <span className={`badge ${priorityColor[(tc.priority || 'Medium')] || 'badge-muted'}`}>{tc.priority || 'Medium'}</span>
            <span className="badge badge-muted">{tc.type || 'Functional'}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{tc.title || 'Test Case'}</h3>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '160px', justifyContent: 'flex-end' }}>
            {(tc.tags || []).map(tag => <span key={tag} className="badge badge-info" style={{ fontSize: '10px' }}>{tag}</span>)}
          </div>
          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => { setDraft(tc); setEditing(true) }} style={{ padding: '6px 10px' }}>✏️</button>
          <button className="btn btn-ghost btn-sm" title="Regenerate this case" onClick={regen} disabled={regenerating} style={{ padding: '6px 10px' }}>
            {regenerating ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: 'var(--primary)' }} /> : '🔄'}
          </button>
          <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => onDelete(idx)} style={{ padding: '6px 10px', color: 'var(--danger)' }}>🗑️</button>
        </div>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div className="story-section-label" style={{ color: 'var(--primary-light)' }}>Steps</div>
            <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              {(tc.steps || []).map((step, i) => <li key={i} style={{ marginBottom: '6px' }}>{step}</li>)}
            </ol>
          </div>
          <div>
            <div className="story-section-label" style={{ color: 'var(--success)' }}>Expected Results</div>
            <ul style={{ paddingLeft: '0', margin: 0, fontSize: '14px', color: 'var(--text-secondary)', listStyleType: 'none' }}>
              {(tc.expected || []).map((exp, i) => (
                <li key={i} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span><span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {tc.ac_traced?.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Traces to AC:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {tc.ac_traced.map(ac => <span key={ac} className="badge badge-info" style={{ fontSize: '10px' }}>AC-{ac}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Attachment Panel ────────────────────────────────────────────────
const AttachmentPanel = ({ story }) => {
  const [expanded, setExpanded] = useState({})
  const images = story?.attachmentImages || []
  const texts = story?.attachmentTexts || []
  if (!images.length && !texts.length) return null

  return (
    <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        📎 Jira Attachments ({images.length + texts.length})
      </div>
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: texts.length ? 12 : 0 }}>
          {images.map(img => (
            <div key={img.name} title={img.name} style={{ width: 60, height: 60, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🖼️
            </div>
          ))}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{images.map(i => i.name).join(', ')}</div>
        </div>
      )}
      {texts.map(f => (
        <div key={f.name} style={{ marginBottom: 8 }}>
          <button onClick={() => setExpanded(e => ({ ...e, [f.name]: !e[f.name] }))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)', fontSize: '13px', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded[f.name] ? '▾' : '▸'} 📄 {f.name}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(included in AI prompt)</span>
          </button>
          {expanded[f.name] && (
            <pre style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, fontSize: '12px', color: 'var(--text-secondary)', overflowX: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {f.content}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}

// ── File Upload Dropzone ────────────────────────────────────────────
const FileDropzone = ({ files, onAdd, onRemove }) => {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const processFiles = (fileList) => {
    Array.from(fileList).forEach(file => {
      const isImage = file.type.startsWith('image/')
      const reader = new FileReader()
      reader.onload = (e) => {
        onAdd({ name: file.name, content: isImage ? null : e.target.result, dataUrl: isImage ? e.target.result : null, isImage })
      }
      isImage ? reader.readAsDataURL(file) : reader.readAsText(file)
    })
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'center',
          background: dragging ? 'var(--bg-glass)' : 'transparent', transition: 'all 0.2s'
        }}
      >
        <div style={{ fontSize: '20px', marginBottom: 4 }}>📎</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Attach screenshots or logs <span style={{ color: 'var(--primary-light)' }}>— click or drop</span></div>
        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: 2 }}>PNG, JPG, GIF, TXT, LOG, CSV, MD</div>
        <input ref={inputRef} type="file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.txt,.log,.csv,.md,.json" style={{ display: 'none' }}
          onChange={e => { processFiles(e.target.files); e.target.value = '' }} />
      </div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: '12px' }}>
              {f.isImage
                ? <img src={f.dataUrl} alt={f.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />
                : <span>📄</span>}
              <span style={{ color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────
export default function TestCaseCreator() {
  const { connections, isConnected, getLLMConfig } = useConnections()
  const { addToast } = useToast()

  const [inputType, setInputType] = useState('jira')
  const [jiraId, setJiraId] = useState('')
  const [manualText, setManualText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [story, setStory] = useState(null)
  const [count, setCount] = useState(5)

  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [testCases, setTestCases] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedStory = localStorage.getItem('currentStory')
    const storedTests = localStorage.getItem('generatedTestCases')
    if (storedStory) { try { setStory(JSON.parse(storedStory)) } catch (_) {} }
    if (storedTests) { try { setTestCases(JSON.parse(storedTests)) } catch (_) {} }
  }, [])

  const getLLMSettings = () => {
    const llmConfig = getLLMConfig()
    return {
      llmProvider: llmConfig.provider || 'openai',
      apiKey: llmConfig.apiKey,
      ollamaUrl: llmConfig.ollamaUrl,
      ollamaModel: llmConfig.ollamaModel,
      groqModel: llmConfig.groqModel,
      geminiModel: llmConfig.geminiModel,
      lmStudioUrl: llmConfig.lmStudioUrl,
      lmStudioModel: llmConfig.lmStudioModel
    }
  }

  const fetchJira = async () => {
    if (!jiraId.trim()) return
    setFetching(true); setError(null); setStory(null); setTestCases(null)
    try {
      if (!isConnected('jira')) throw new Error('Jira is not configured. Go to Integrations to set it up.')
      const jiraConf = connections.jira || {}
      const resp = await jiraService.fetch(jiraId, jiraConf)
      setStory(resp.data.story)
      localStorage.setItem('currentStory', JSON.stringify(resp.data.story))
      setJiraId('')   // clear input after successful fetch
      addToast(`Loaded ${resp.data.story.id}`, 'success')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      addToast('Failed to fetch Jira story', 'error')
    } finally {
      setFetching(false)
    }
  }

  const loadManual = () => {
    if (!manualText.trim()) return
    setError(null); setTestCases(null)
    const mockStory = {
      id: 'MANUAL-1', title: 'Manual Requirement', description: manualText,
      acceptance_criteria: [], priority: 'Medium', type: 'Requirement',
      uploadedFiles: uploadedFiles.map(f => ({ name: f.name, content: f.content }))
    }
    setStory(mockStory)
    localStorage.setItem('currentStory', JSON.stringify(mockStory))
    addToast('Manual requirements loaded', 'success')
  }

  const generateCases = async () => {
    if (!story) { setError('Please provide a user story first.'); return }
    setGenerating(true); setError(null); setTestCases(null)
    try {
      const settings = { ...getLLMSettings(), count }
      // Attach user-uploaded files to the story for the API
      const storyWithFiles = {
        ...story,
        uploadedFiles: uploadedFiles.map(f => ({ name: f.name, content: f.content }))
      }
      const resp = await generateService.testCases(storyWithFiles, settings)
      const data = resp.data
      if (!data.testCases?.length) throw new Error('API returned no test cases')

      setTestCases(data.testCases)
      localStorage.setItem('generatedTestCases', JSON.stringify(data.testCases))

      // Save to history
      const history = JSON.parse(localStorage.getItem('testCaseHistory') || '[]')
      history.unshift({ story, testCases: data.testCases, createdAt: new Date().toISOString() })
      localStorage.setItem('testCaseHistory', JSON.stringify(history.slice(0, 50)))

      // Clear inputs after generation
      setJiraId('')
      setManualText('')
      setUploadedFiles([])

      addToast(`Generated ${data.testCases.length} test cases!`, 'success')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      addToast('Failed to generate test cases', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdate = (idx, updated) => {
    const next = testCases.map((tc, i) => i === idx ? updated : tc)
    setTestCases(next)
    localStorage.setItem('generatedTestCases', JSON.stringify(next))
  }

  const handleDelete = (idx) => {
    const next = testCases.filter((_, i) => i !== idx)
    setTestCases(next)
    localStorage.setItem('generatedTestCases', JSON.stringify(next))
  }

  const handleAddCard = () => {
    const newCard = {
      id: `TC-${String(testCases.length + 1).padStart(3, '0')}`,
      title: '', type: 'Functional', priority: 'Medium',
      steps: [], expected: [], tags: [], ac_traced: [], _new: true
    }
    setTestCases(prev => [...(prev || []), newCard])
  }

  const exportJson = () => {
    if (!testCases) return
    const clean = testCases.map(({ _new, ...tc }) => tc)
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `test-cases-${story?.id || 'export'}.json`; a.click()
    addToast('JSON exported successfully', 'success')
  }

  const llmSettings = getLLMSettings()

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)' }}>
            🧪 TEST ARCHITECTURE
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Test Case Creator</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Automatically extract and write mathematically precise testing sequences from ambiguous requirements.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}

      <div className="content-grid">
        {/* ── Left: Input ── */}
        <div className="premium-card">
          <h2>Input Requirement</h2>

          <div className="form-group">
            <label className="form-label">Source Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`btn ${inputType === 'jira' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputType('jira')}>Jira ID</button>
              <button className={`btn ${inputType === 'manual' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputType('manual')}>Paste Context</button>
            </div>
          </div>

          <div className="form-group">
            {inputType === 'jira' ? (
              <>
                <label className="form-label">Jira Issue ID</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="text" className="form-input" placeholder="e.g. AUTH-123"
                    value={jiraId} onChange={e => setJiraId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchJira()} />
                  <button className="btn btn-primary" onClick={fetchJira} disabled={fetching || !jiraId.trim()}>
                    {fetching ? '⏳ Fetching...' : '🔍 Fetch'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="form-label">Paste Your Requirement</label>
                <textarea className="form-textarea" placeholder="Paste your user story, acceptance criteria, or requirements here..."
                  style={{ minHeight: 120, resize: 'vertical' }}
                  value={manualText} onChange={e => setManualText(e.target.value)} />
                <FileDropzone
                  files={uploadedFiles}
                  onAdd={f => setUploadedFiles(prev => [...prev, f])}
                  onRemove={i => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                />
                <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={loadManual} disabled={!manualText.trim()}>
                  📝 Load Requirement
                </button>
              </>
            )}
          </div>

          <StoryCard story={story} compact />
          <AttachmentPanel story={story} />

          {story && (
            <div style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Test Case Count</span>
                  <span style={{ color: 'var(--primary-light)', fontWeight: 800 }}>{count}</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={1} max={20} value={count} onChange={e => setCount(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--primary)' }} />
                  <input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                    className="form-input" style={{ width: 64, textAlign: 'center', padding: '8px 10px' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                  ~{Math.round(count * 0.4)} positive · ~{Math.round(count * 0.3)} negative · ~{Math.round(count * 0.3)} edge cases
                </div>
              </div>

              <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}
                onClick={generateCases} disabled={generating}>
                {generating ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', marginRight: 8 }} /> : '🤖'}
                {generating ? 'Generating Test Cases...' : `Generate ${count} Test Cases`}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {testCases && testCases.length > 0 ? (
            <>
              {/* Toolbar */}
              <div className="premium-card" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <h2 style={{ margin: 0, padding: 0 }}>Generated Test Cases
                    <span style={{ fontSize: '15px', fontWeight: 500, marginLeft: 8, color: 'var(--text-muted)' }}>({testCases.length})</span>
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleAddCard}>➕ Add Case</button>
                    <button className="btn btn-secondary btn-sm" onClick={exportJson}>📥 Export JSON</button>
                  </div>
                </div>
              </div>

              {testCases.map((tc, idx) => (
                <TestCaseCard
                  key={`${tc.id}-${idx}`}
                  tc={tc} idx={idx} story={story}
                  llmSettings={{ ...llmSettings, count: 1 }}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onRegenerate={handleUpdate}
                />
              ))}
            </>
          ) : (
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
    </div>
  )
}
