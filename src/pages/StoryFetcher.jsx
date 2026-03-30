import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnections } from '../hooks/useConnections'
import { jiraService, adoService } from '../services/api'
import StoryCard from '../components/StoryCard.jsx'
import { MOCK_STORIES } from '../utils/mockData.js'

const SOURCES = [
  { id: 'jira', label: 'Jira',         icon: '🔷', placeholder: 'e.g. PROJ-101' },
  { id: 'ado',  label: 'Azure DevOps', icon: '🔵', placeholder: 'e.g. 4521' },
  { id: 'mock', label: 'Demo / Mock',  icon: '🧪', placeholder: 'e.g. DEMO-1' },
]

export default function StoryFetcher() {
  const navigate = useNavigate()
  const { connections, isConnected } = useConnections()
  const [source, setSource] = useState('jira')
  const [storyId, setStoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [story, setStory]     = useState(null)
  const [error, setError]     = useState(null)

  const fetchStory = async () => {
    if (!storyId.trim()) return
    setLoading(true); setError(null); setStory(null)

    try {
      if (source === 'mock') {
        await new Promise(r => setTimeout(r, 800))
        const mock = MOCK_STORIES[storyId.toUpperCase()]
        if (!mock) throw new Error(`No mock story found for "${storyId}". Try DEMO-1, DEMO-2, or DEMO-3.`)
        setStory(mock)
        return
      }

      if (!isConnected(source)) {
        throw new Error(`${source.toUpperCase()} is not connected. Please go to Integrations to set it up.`)
      }

      const creds = connections[source] || {}
      let resp;
      if (source === 'jira') {
        resp = await jiraService.fetch(storyId, creds)
      } else {
        resp = await adoService.fetch(storyId, creds)
      }

      setStory(resp.data.story)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = () => {
    if (!story) return
    sessionStorage.setItem('pendingStory', JSON.stringify(story))
    navigate('/create')
  }

  const handleCreateCases = () => {
    if (!story) return
    localStorage.setItem('currentStory', JSON.stringify(story))
    navigate('/test-cases')
  }

  const currentSource = SOURCES.find(s => s.id === source)

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            🔍 INGESTION ENGINE
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Story Origin Fetcher</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Connect to Jira or Azure DevOps to instantly import complex tickets for analysis and decomposition.</p>
        </div>
      </div>

      {/* Source Selector */}
      <div className="premium-card" style={{ marginBottom: 32 }}>
        <h2>Database Connectivity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {SOURCES.map(s => (
              <button
                key={s.id}
                onClick={() => { setSource(s.id); setStory(null); setError(null) }}
                className={`btn ${source === s.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                {s.icon} {s.label}
                {s.id !== 'mock' && connections[s.id]?.connected && (
                  <span className="badge badge-success" style={{ marginLeft: 6 }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {source !== 'mock' && !connections[source]?.connected && (
            <div className="alert alert-warning">
              ⚠️ <strong>{currentSource?.label} is not connected.</strong> Go to{' '}
              <a href="/connectors" style={{ color: 'var(--warning)', textDecoration: 'underline' }}>Integrations</a>{' '}
              to set up your credentials, or use <strong>Demo / Mock</strong> to try the app.
            </div>
          )}

          {source === 'mock' && (
            <div className="alert alert-info">
              🧪 <strong>Demo mode:</strong> Use IDs <code>DEMO-1</code>, <code>DEMO-2</code>, or <code>DEMO-3</code> to test the app without real integrations.
            </div>
          )}

          <label className="form-label">{currentSource?.label} Story ID</label>
          <div className="input-group">
            <input
              type="text"
              className="form-input form-input-mono"
              placeholder={currentSource?.placeholder}
              value={storyId}
              onChange={e => setStoryId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchStory()}
            />
            <button
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              onClick={fetchStory}
              disabled={loading || !storyId.trim()}
            >
              {loading ? '' : '⚡ Fetch'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">❌ {error}</div>}

      {/* Story Result */}
      {story && (
        <div style={{ animation: 'slideUp 0.3s ease' }}>
          <StoryCard story={story} />
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => { setStory(null); setStoryId('') }}>
              🔄 Fetch Another
            </button>
            <button className="btn btn-secondary" onClick={handleCreateCases}>
              🧪 Create Test Cases
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
              📋 Generate Test Plan →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
