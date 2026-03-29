import { useState, useEffect } from 'react'

export default function CodeGenerator() {
  const [testCases, setTestCases] = useState(null)
  const [story, setStory] = useState(null)
  const [framework, setFramework] = useState('Playwright')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const frameworks = [
    'Playwright',
    'Selenium Java'
  ]

  useEffect(() => {
    loadTestCasesFromSession()
  }, [])

  const loadTestCasesFromSession = () => {
    const stored = localStorage.getItem('generatedTestCases')
    const storedStory = localStorage.getItem('currentStory')
    
    console.log('Session Load:', { hasTestCases: !!stored, hasStory: !!storedStory })

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const testCasesArray = Array.isArray(parsed) ? parsed : [parsed]
        setTestCases(testCasesArray)
        setError(null)
      } catch (e) {
        console.error('Parse error:', e)
        setError('Failed to load test cases from session: ' + e.message)
      }
    } else {
      setError('❌ No test cases found in localStorage. Generate test cases in the Create Cases section first.')
    }

    if (storedStory) {
      try {
        const parsedStory = JSON.parse(storedStory)
        setStory(parsedStory)
        console.log('✅ Loaded story context:', parsedStory.id)
      } catch (e) {
        console.error('Story parse error:', e)
      }
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
    setSuccessMessage('')

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
        setError('❌ API Key Error (401). Your LLM API key is invalid or expired. Go to 🔌 Integrations to update.')
        setLoading(false)
        return
      }
      
      if (!response.ok) throw new Error(data.error || 'Code generation failed')

      setGeneratedCode(data.code)
      setSuccessMessage(`✅ Code generated successfully for ${framework}`)
    } catch (e) {
      const errorMsg = e.message || 'Unknown error'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    setSuccessMessage('✅ Code copied to clipboard!')
    setTimeout(() => setSuccessMessage(''), 2000)
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
    setSuccessMessage(`✅ Downloaded as ${filename}`)
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🤖 Code Generator</h1>
        <p>Generate automation code from your test cases for the full function</p>
      </div>

      {/* Story Context Display */}
      {story ? (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: 'rgba(79, 70, 229, 0.05)', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>📋 Story Context</div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                {story.id} - {story.title}
              </div>
              {story.description && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {story.description.substring(0, 150)}
                  {story.description.length > 150 ? '...' : ''}
                </div>
              )}
            </div>
            <div style={{ fontSize: '24px' }}>🎯</div>
          </div>
        </div>
      ) : testCases ? (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: 'rgba(255, 152, 0, 0.05)', borderLeft: '4px solid #ff9800' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <strong>No story metadata found</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Test cases are loaded, but the associated story metadata is missing. 
                Please go back to <strong>Fetch Story</strong> and click <strong>Create Test Cases</strong> again to link the story context.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: 'rgba(255, 152, 0, 0.05)', borderLeft: '4px solid #ff9800' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <strong>No test cases loaded</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                The story context will appear here once you load test cases. This helps identify which story/task the generated code is for.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content-grid">
        {/* ── Left Panel: Configuration ──────────────── */}
        <div className="card">
          <h2>Configuration</h2>

          {/* Load Test Cases */}
          <div className="form-group">
            <label>Step 1: Load Test Cases</label>
            <button 
              onClick={loadTestCasesFromSession}
              className="btn btn-primary"
              disabled={loading}
            >
              📥 Load from Session
            </button>
            <button 
              onClick={() => {
                const stored = localStorage.getItem('generatedTestCases')
                if (stored) {
                  const count = JSON.parse(stored).length
                  alert(`✅ Found ${count} test cases in storage`)
                } else {
                  alert('❌ No test cases in storage. Generate them in Create Cases first.')
                }
              }}
              style={{ marginLeft: '8px' }}
              className="btn btn-secondary"
              title="Check what's in storage"
            >
              🔍 Check Storage
            </button>
            {testCases && (
              <div className="info-box" style={{ marginTop: '10px' }}>
                ✅ Loaded {testCases.length} test case(s)
              </div>
            )}
          </div>

          {/* Framework Selection */}
          <div className="form-group">
            <label>Step 2: Select Framework</label>
            <select 
              value={framework} 
              onChange={(e) => setFramework(e.target.value)}
              disabled={loading}
              className="form-input"
            >
              {frameworks.map(fw => (
                <option key={fw} value={fw}>{fw}</option>
              ))}
            </select>
            <small>Choose the framework for code generation</small>
          </div>

          {/* Generate Button */}
          <div className="form-group">
            <label>Step 3: Generate Code</label>
            <button 
              onClick={generateCode}
              disabled={loading || !testCases}
              className="btn btn-success"
            >
              {loading ? '⏳ Generating...' : '⚡ Generate Code'}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="error-box">
              ❌ {error}
            </div>
          )}
          {successMessage && (
            <div className="success-box">
              {successMessage}
            </div>
          )}
        </div>

        {/* ── Right Panel: Generated Code ──────────────── */}
        {generatedCode && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>{framework} Code</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={copyToClipboard}
                  className="btn btn-secondary"
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
                <button 
                  onClick={downloadCode}
                  className="btn btn-secondary"
                  title="Download file"
                >
                  💾 Download
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '600px',
              fontFamily: 'Courier New, monospace',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              <pre>{generatedCode}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      {!generatedCode && (
        <div className="card">
          <h3>📖 How It Works</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Generate test cases in the <strong>Create Cases</strong> section</li>
            <li>Click <strong>Load from Session</strong> to load your test cases</li>
            <li>Select your preferred automation framework</li>
            <li>Click <strong>Generate Code</strong> to create the automation script</li>
            <li>Copy or download the generated code to use in your project</li>
          </ol>
          <p style={{ marginTop: '12px', color: '#888' }}>
            💡 The code generator creates a complete function that covers all your test cases in a single file.
          </p>
        </div>
      )}
    </div>
  )
}
