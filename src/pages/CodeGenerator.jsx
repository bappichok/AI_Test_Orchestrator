import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import StoryCard from '../components/StoryCard.jsx'
import { generateService } from '../services/api'

// ── Review Score Panel ──────────────────────────────────────────────
const ReviewPanel = ({ review, onAutoFix, fixing }) => {
  const scoreColor = review.score >= 90 ? '#10b981' : review.score >= 70 ? '#f59e0b' : '#ef4444'
  const gradeLabel = review.grade || '–'

  return (
    <div className="card" style={{ marginTop: 20, border: `1px solid ${scoreColor}40` }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          🔍 Code Quality Review
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{review.score}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</div>
          </div>
          <div style={{ background: scoreColor, color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: '20px', fontWeight: 800 }}>{gradeLabel}</div>
        </div>
      </div>

      <div className="card-body" style={{ display: 'grid', gap: 16 }}>
        {review.passed?.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>✅ Passed ({review.passed.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {review.passed.map((p, i) => (
                <span key={i} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '3px 10px', fontSize: '13px' }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {review.warnings?.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚠️ Warnings ({review.warnings.length})</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {review.warnings.map((w, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 4 }}>{w}</li>)}
            </ul>
          </div>
        )}

        {review.failed?.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>❌ Failed ({review.failed.length})</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {review.failed.map((f, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 4 }}>{f}</li>)}
            </ul>
          </div>
        )}

        {review.suggestion && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-light)', marginBottom: 4 }}>💡 Suggestion</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{review.suggestion}</div>
          </div>
        )}

        {(review.failed?.length > 0 || review.warnings?.length > 0) && (
          <button className="btn btn-primary" onClick={onAutoFix} disabled={fixing} style={{ justifyContent: 'center' }}>
            {fixing ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', marginRight: 8 }} />Auto-fixing...</> : '🔧 Auto-fix Issues'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Code Viewer ─────────────────────────────────────────────────────
const CodeViewer = ({ framework, code, onCopy, onDownload, onReview, reviewing }) => (
  <div className="card">
    <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ margin: 0, fontSize: '16px' }}>{framework} Code</h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onReview} className="btn btn-secondary btn-sm" disabled={reviewing}>
          {reviewing ? <><span className="spinner" style={{ width: 12, height: 12, borderTopColor: 'var(--primary)', marginRight: 6 }} />Reviewing...</> : '🔍 Review Code'}
        </button>
        <button onClick={onCopy} className="btn btn-secondary btn-sm">📋 Copy</button>
        <button onClick={onDownload} className="btn btn-secondary btn-sm">💾 Download</button>
      </div>
    </div>
    <div style={{ backgroundColor: '#1e1e1e', padding: '24px', overflowX: 'auto', maxHeight: '600px', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
      <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.6', color: '#d4d4d4', margin: 0 }}>{code}</pre>
    </div>
  </div>
)

const MissingContextBanner = ({ type }) => {
  const content = type === 'story'
    ? { title: 'No story metadata found', desc: 'Test cases are loaded, but the associated story metadata is missing. Please go back to Fetch Story and click Create Test Cases again to link the story context.' }
    : { title: 'No test cases loaded', desc: 'The story context will appear here once you load test cases. This helps identify which story/task the generated code is for.' }
  return (
    <div className="card" style={{ marginBottom: '20px', backgroundColor: 'rgba(245,158,11,0.05)', borderLeft: '4px solid var(--warning)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>{content.title}</strong>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{content.desc}</div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────
export default function CodeGenerator() {
  const { addToast } = useToast()

  const [testCases, setTestCases] = useState(null)
  const [story, setStory] = useState(null)
  const [framework, setFramework] = useState('Playwright')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [review, setReview] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [fixing, setFixing] = useState(false)

  const frameworks = ['Playwright', 'Selenium Java']

  useEffect(() => { loadTestCasesFromSession() }, [])

  const loadTestCasesFromSession = (isManualClick = false) => {
    const stored = localStorage.getItem('generatedTestCases')
    const storedStory = localStorage.getItem('currentStory')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        setTestCases(arr); setError(null)
        if (isManualClick) addToast(`Loaded ${arr.length} test cases!`, 'success')
      } catch (e) {
        setError('Failed to load test cases: ' + e.message)
        if (isManualClick) addToast('Failed to load storage format', 'error')
      }
    } else {
      const msg = 'No test cases found. Generate them in Create Cases first.'
      setError(msg)
      if (isManualClick) addToast(msg, 'warning')
    }
    if (storedStory) { try { setStory(JSON.parse(storedStory)) } catch (_) {} }
  }

  const getLLMSettings = () => {
    const connections = JSON.parse(localStorage.getItem('connections') || '{}')
    const llm = connections.llm || {}
    return {
      llmProvider: llm.provider || 'openai',
      apiKey: llm.apiKey,
      ollamaUrl: llm.ollamaUrl,
      ollamaModel: llm.ollamaModel,
      groqModel: llm.groqModel,
      geminiModel: llm.geminiModel,
      customUrl: llm.customUrl,
      customModel: llm.customModel
    }
  }

  const generateCode = async () => {
    if (!testCases?.length) { setError('No test cases loaded.'); return }
    setLoading(true); setError(null); setGeneratedCode(''); setReview(null)
    try {
      const response = await fetch('/api/generate/automation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases, story, framework, llmSettings: getLLMSettings() })
      })
      const data = await response.json()
      if (response.status === 401) throw new Error('Invalid API key — update it in Integrations.')
      if (!response.ok) throw new Error(data.error || 'Code generation failed')
      setGeneratedCode(data.code)

      const history = JSON.parse(localStorage.getItem('automationHistory') || '[]')
      history.unshift({ story, code: data.code, framework, createdAt: new Date().toISOString() })
      localStorage.setItem('automationHistory', JSON.stringify(history.slice(0, 50)))
      addToast(`${framework} code generated successfully!`, 'success')
    } catch (e) {
      setError(e.message)
      addToast('Code generation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!generatedCode) return
    setReviewing(true); setReview(null)
    try {
      const resp = await generateService.reviewCode(generatedCode, framework, getLLMSettings())
      setReview(resp.data.review)
      addToast('Code review complete!', 'success')
    } catch (e) {
      addToast('Review failed: ' + (e.response?.data?.error || e.message), 'error')
    } finally {
      setReviewing(false)
    }
  }

  const handleAutoFix = async () => {
    if (!generatedCode || !review) return
    setFixing(true)
    try {
      const resp = await generateService.autoFix(generatedCode, framework, review.failed || [], review.warnings || [], getLLMSettings())
      setGeneratedCode(resp.data.code)
      setReview(null)
      addToast('Code auto-fixed! Re-run review to verify.', 'success')
    } catch (e) {
      addToast('Auto-fix failed: ' + (e.response?.data?.error || e.message), 'error')
    } finally {
      setFixing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    addToast('Code copied to clipboard!', 'success')
  }

  const downloadCode = () => {
    const ext = framework.toLowerCase().includes('java') ? 'java' : 'js'
    const filename = `test_automation.${ext}`
    const el = document.createElement('a')
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatedCode))
    el.setAttribute('download', filename); el.style.display = 'none'
    document.body.appendChild(el); el.click(); document.body.removeChild(el)
    addToast(`${filename} downloaded!`, 'success')
  }

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)' }}>
            ✨ CODE GENERATION SUITE
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Code Generator Engine</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Instantly generate automation wrappers and page objects directly from your execution sequences.</p>
        </div>
      </div>

      {story ? <StoryCard story={story} compact /> : testCases ? <MissingContextBanner type="story" /> : <MissingContextBanner type="empty" />}

      <div className="content-grid">
        {/* ── Left: Config ── */}
        <div className="premium-card">
          <h2>Configuration Workflow</h2>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Step 1: Load Test Cases</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => loadTestCasesFromSession(true)} className="btn btn-primary" disabled={loading}>📥 Extract from Session</button>
              <button onClick={() => {
                const stored = localStorage.getItem('generatedTestCases')
                if (stored) addToast(`${JSON.parse(stored).length} test cases in storage.`, 'info')
                else addToast('Storage empty. Generate test cases first.', 'warning')
              }} className="btn btn-secondary" title="Check storage">🔍 Check Storage</button>
            </div>
            {testCases && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: '14px', color: 'var(--success)' }}>
                ✅ Tracking <strong>{testCases.length}</strong> test sequence(s)
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Step 2: Architecture Framework</label>
            <select value={framework} onChange={e => { setFramework(e.target.value); setReview(null) }} disabled={loading} className="form-select">
              {frameworks.map(fw => <option key={fw} value={fw}>{fw}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 24, marginBottom: 0 }}>
            <label className="form-label">Step 3: Execute Generation</label>
            <button onClick={generateCode} disabled={loading || !testCases} className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', marginRight: 8 }} /> : '⚡'}
              {loading ? 'Synthesizing Automation Code...' : 'Generate Automation Code'}
            </button>
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: 16, marginBottom: 0 }}>❌ {error}</div>}

          {/* Review guide */}
          {generatedCode && !review && (
            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>💡 Validate Your Code</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Click <strong>🔍 Review Code</strong> in the code panel to get an AI quality score, check for POM structure, waits, assertions, and CI-readiness.
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Code + Review ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {generatedCode ? (
            <>
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <CodeViewer framework={framework} code={generatedCode}
                  onCopy={copyToClipboard} onDownload={downloadCode}
                  onReview={handleReview} reviewing={reviewing} />
              </div>
              {review && (
                <ReviewPanel review={review} onAutoFix={handleAutoFix} fixing={fixing} />
              )}
            </>
          ) : (
            <div className="premium-card">
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <h3 className="empty-title">Execution Workflow</h3>
                <div className="empty-desc" style={{ maxWidth: '100%' }}>
                  <ol style={{ paddingLeft: '20px', lineHeight: '2', textAlign: 'left', marginTop: 12 }}>
                    <li>Finalize your test cases inside the <strong>Create Cases</strong> portal.</li>
                    <li>Click <strong>Extract from Session</strong> to bind your test sequences.</li>
                    <li>Select your target automation framework.</li>
                    <li>Click <strong>Generate</strong>, then <strong>🔍 Review Code</strong> to validate quality.</li>
                    <li>Use <strong>🔧 Auto-fix</strong> to resolve any detected issues automatically.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
