import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import StoryCard from '../components/StoryCard.jsx'

// Utility Components
const MissingContextBanner = ({ type }) => {
  const content = type === 'story' ? {
    title: 'No story metadata found',
    desc: 'Test cases are loaded, but the associated story metadata is missing. Please go back to Fetch Story and click Create Test Cases again to link the story context.'
  } : {
    title: 'No test cases loaded',
    desc: 'The story context will appear here once you load test cases. This helps identify which story/task the generated code is for.'
  };

  return (
    <div className="card" style={{ marginBottom: '20px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderLeft: '4px solid var(--warning)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>{content.title}</strong>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {content.desc}
          </div>
        </div>
      </div>
    </div>
  );
};

const CodeViewer = ({ framework, code, onCopy, onDownload }) => (
  <div className="card">
    <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ margin: 0, fontSize: '16px' }}>{framework} Code</h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCopy} className="btn btn-secondary btn-sm" title="Copy to clipboard">
          📋 Copy
        </button>
        <button onClick={onDownload} className="btn btn-secondary btn-sm" title="Download file">
          💾 Download
        </button>
      </div>
    </div>
    <div style={{
      backgroundColor: '#1e1e1e',
      padding: '24px',
      overflowX: 'auto',
      maxHeight: '600px',
      borderBottomLeftRadius: 'var(--radius-lg)',
      borderBottomRightRadius: 'var(--radius-lg)'
    }}>
      <pre style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#d4d4d4',
        margin: 0
      }}>
        {code}
      </pre>
    </div>
  </div>
);

export default function CodeGenerator() {
  const { addToast } = useToast()
  
  const [testCases, setTestCases] = useState(null)
  const [story, setStory] = useState(null)
  const [framework, setFramework] = useState('Playwright')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const frameworks = ['Playwright', 'Selenium Java']

  useEffect(() => {
    loadTestCasesFromSession()
  }, [])

  const loadTestCasesFromSession = (isManualClick = false) => {
    const stored = localStorage.getItem('generatedTestCases')
    const storedStory = localStorage.getItem('currentStory')

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const testCasesArray = Array.isArray(parsed) ? parsed : [parsed]
        setTestCases(testCasesArray)
        setError(null)
        if (isManualClick) addToast(`Successfully loaded ${testCasesArray.length} test cases!`, 'success')
      } catch (e) {
        setError('Failed to load test cases from session: ' + e.message)
        if (isManualClick) addToast('Failed to load storage format', 'error')
      }
    } else {
      const msg = 'No test cases found. Generate them in Create Cases first.'
      setError(msg)
      if (isManualClick) addToast(msg, 'warning')
    }

    if (storedStory) {
      try {
        setStory(JSON.parse(storedStory))
      } catch (e) {
        console.error('Story parse error:', e)
      }
    }
  }

  const handleCheckStorage = () => {
    const stored = localStorage.getItem('generatedTestCases')
    if (stored) {
      const count = JSON.parse(stored).length
      addToast(`Storage contains ${count} valid test cases awaiting generation.`, 'info')
    } else {
      addToast('Storage is completely empty. Please generate test cases first.', 'warning')
    }
  }

  const generateCode = async () => {
    if (!testCases || testCases.length === 0) {
      setError('No test cases loaded. Load test cases first.')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedCode('')

    try {
      const connections = JSON.parse(localStorage.getItem('connections') || '{}')
      const llmConfig = connections.llm || {}

      const response = await fetch('/api/generate/automation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCases,
          story,
          framework,
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
      
      if (response.status === 401) {
        throw new Error('API Key Error (401). Your LLM API key is invalid or expired. Go to Integrations to update.')
      }
      
      if (!response.ok) throw new Error(data.error || 'Code generation failed')

      setGeneratedCode(data.code)
      addToast(`Code generated for ${framework} successfully!`, 'success')
    } catch (e) {
      setError(e.message || 'Unknown error occurred')
      addToast('Failed to orchestrate code generation', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    addToast('Code seamlessly copied to clipboard!', 'success')
  }

  const downloadCode = () => {
    const ext = framework.toLowerCase().includes('python') ? 'py' : 'js'
    const filename = `test_automation.${ext}`
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatedCode))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    addToast(`${filename} downloaded safely!`, 'success')
  }

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            ✨ CODE GENERATION SUITE
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Code Generator Engine</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Instantly generate automation wrappers and page objects directly from your execution sequences.</p>
        </div>
      </div>

      {story ? <StoryCard story={story} compact /> : testCases ? <MissingContextBanner type="story" /> : <MissingContextBanner type="empty" />}

      <div className="content-grid">
        {/* ── Left Panel: Configuration ──────────────── */}
        <div className="card">
          <h2>Configuration Workflow</h2>

          {/* Load Test Cases */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Step 1: Load Test Cases</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => loadTestCasesFromSession(true)} className="btn btn-primary" disabled={loading}>
                📥 Extract from Session
              </button>
              <button onClick={handleCheckStorage} className="btn btn-secondary" title="Inspect Browser Cache">
                🔍 Check Storage
              </button>
            </div>
            {testCases && (
              <div className="info-box" style={{ marginTop: '12px' }}>
                ✅ Successfully tracking <strong>{testCases.length}</strong> test sequence(s).
              </div>
            )}
          </div>

          {/* Framework Selection */}
          <div className="form-group">
            <label className="form-label">Step 2: Architecture Framework</label>
            <select 
              value={framework} 
              onChange={(e) => setFramework(e.target.value)}
              disabled={loading}
              className="form-select"
            >
              {frameworks.map(fw => <option key={fw} value={fw}>{fw}</option>)}
            </select>
          </div>

          {/* Generate Button */}
          <div className="form-group" style={{ marginTop: 24, marginBottom: 0 }}>
            <label className="form-label">Step 3: Execute Generation</label>
            <button 
              onClick={generateCode}
              disabled={loading || !testCases}
              className="btn btn-success"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? <span className="spinner" style={{width: 16, height: 16, borderTopColor: '#fff', marginRight: 8}} /> : '⚡'}
              {loading ? 'Synthesizing Automation Code...' : 'Generate Automation Code'}
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 16, marginBottom: 0 }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* ── Right Panel: Generated Code ──────────────── */}
        {generatedCode ? (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <CodeViewer 
              framework={framework} 
              code={generatedCode} 
              onCopy={copyToClipboard} 
              onDownload={downloadCode} 
            />
          </div>
        ) : (
          <div className="premium-card">
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3 className="empty-title">Execution Workflow</h3>
              <p className="empty-desc" style={{ maxWidth: '100%' }}>
                <ol style={{ paddingLeft: '20px', lineHeight: '2', textAlign: 'left', marginTop: 12 }}>
                  <li>Finalize your test cases inside the <strong>Create Cases</strong> portal.</li>
                  <li>Click <strong>Extract from Session</strong> to bind your test sequences locally.</li>
                  <li>Configure your desired target architecture mapping.</li>
                  <li>Click <strong>Generate Automation Code</strong> to produce your test class implementation.</li>
                </ol>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
