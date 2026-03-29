import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnections } from '../hooks/useConnections'
import { jiraService, adoService } from '../services/api'

const SOURCES = [
  { id: 'jira', label: 'Jira',         icon: '🔷', placeholder: 'e.g. PROJ-101' },
  { id: 'ado',  label: 'Azure DevOps', icon: '🔵', placeholder: 'e.g. 4521' },
  { id: 'mock', label: 'Demo / Mock',  icon: '🧪', placeholder: 'e.g. DEMO-1' },
]

const MOCK_STORIES = {
  'DEMO-1': {
    id: 'DEMO-1', title: 'User Login with Email and Password',
    description: 'As a registered user, I want to log in using my email and password so that I can access my account dashboard and personalized settings.',
    acceptance_criteria: [
      'Email must be in valid format (user@domain.com)',
      'Password minimum 8 characters with at least one uppercase and one number',
      'User is locked out after 5 consecutive failed login attempts',
      'Successful login redirects to Dashboard',
      'Session expires after 30 minutes of inactivity',
      'Remember Me option extends session to 30 days'
    ],
    priority: 'High', type: 'Story', epic: 'Authentication',
    labels: ['auth', 'login', 'security'],
    status: 'In Progress', assignee: 'Jane Smith', reporter: 'Product Owner',
    flags: []
  },
  'DEMO-2': {
    id: 'DEMO-2', title: 'Password Reset via Email',
    description: 'User can reset password.',
    acceptance_criteria: [],
    priority: 'Medium', type: 'Story', epic: 'Authentication',
    labels: ['auth', 'password'],
    status: 'Backlog', assignee: 'Unassigned', reporter: 'QA Lead',
    flags: ['MISSING_AC', 'VAGUE_DESC']
  },
  'DEMO-3': {
    id: 'DEMO-3', title: 'Product Search with Filters',
    description: 'As a shopper, I want to search for products using keywords and apply filters (category, price range, brand, rating) so I can quickly find relevant items.',
    acceptance_criteria: [
      'Search returns results within 500ms',
      'Filters can be combined (AND logic)',
      'No results state shows suggestions',
      'Search is case-insensitive',
      'Minimum 3 characters required to trigger search'
    ],
    priority: 'Critical', type: 'Story', epic: 'Product Catalog',
    labels: ['search', 'frontend', 'performance'],
    status: 'Ready for QA', assignee: 'Bob Johnson', reporter: 'Product Manager',
    flags: []
  }
}

function FlagBanner({ flags }) {
  if (!flags?.length) return null
  return (
    <div>
      {flags.map(f => (
        <div key={f} className="flag-warning">
          ⚠️ <strong>{f === 'MISSING_AC' ? 'Missing Acceptance Criteria' : 'Vague Description'}</strong>
          {f === 'MISSING_AC' && ' — Test plan will include placeholder AC. Please update the story.'}
          {f === 'VAGUE_DESC' && ' — Description has fewer than 20 words. Some test scenarios may be broad.'}
        </div>
      ))}
    </div>
  )
}

function StoryCard({ story }) {
  console.log('StoryCard rendering with story:', story)
  const priorityClass = `priority-${story.priority?.toLowerCase()}`
  return (
    <div className="story-card">
      <div className="story-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="story-id">{story.id}</span>
            <span className={`badge ${priorityClass}`}>{story.priority}</span>
            <span className="badge badge-muted">{story.type}</span>
          </div>
          <div className="story-title">{story.title}</div>
          <div className="story-meta">
            {story.epic && <span className="tag">📁 {story.epic}</span>}
            {story.assignee && <span className="tag">👤 {story.assignee}</span>}
            {story.status  && <span className="tag">🔄 {story.status}</span>}
            {story.labels?.map(l => <span key={l} className="tag"># {l}</span>)}
          </div>
        </div>
      </div>
      <div className="story-body">
        <FlagBanner flags={story.flags} />
        <div className="story-section">
          <div className="story-section-label">Description</div>
          <div className="story-desc">{story.description || 'No description provided.'}</div>
        </div>
        {story.acceptance_criteria?.length > 0 && (
          <div className="story-section">
            <div className="story-section-label">Acceptance Criteria ({story.acceptance_criteria.length})</div>
            <ul className="ac-list">
              {story.acceptance_criteria.map((ac, i) => <li key={i}>{ac}</li>)}
            </ul>
          </div>
        )}
        {story.attachments?.length > 0 && (
          <div className="story-section">
            <div className="story-section-label">📎 Attachments ({story.attachments.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {story.attachments.map((att, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px' }}>
                  <span style={{ fontSize: 18 }}>
                    {att.mimeType?.includes('image') ? '🖼️' : '📄'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{att.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {(att.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                    🔗 View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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

      console.log('✅ Story fetched:', resp.data.story)
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
      <div className="page-header">
        <div className="breadcrumb"><span>Home</span><span className="sep">/</span><span>Fetch Story</span></div>
        <h1>🔍 Fetch Story</h1>
        <p>Connect to your project management tool and fetch a story to begin QA extraction.</p>
      </div>

      {/* Source Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Select Source</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
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
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', maxHeight: 100, overflow: 'auto' }}>
            <details>
              <summary>🔍 Debug: Story Data</summary>
              <pre>{JSON.stringify(story, null, 2)}</pre>
            </details>
          </div>
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
