import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Connectors from './pages/Connectors.jsx'
import StoryFetcher from './pages/StoryFetcher.jsx'
import TestPlanCreator from './pages/TestPlanCreator.jsx'
import TestCaseCreator from './pages/TestCaseCreator.jsx'
import History from './pages/History.jsx'

const navItems = [
  { to: '/',           icon: '⚡', label: 'Dashboard'  },
  { to: '/fetch',      icon: '🔍', label: 'Fetch Story' },
  { to: '/create',     icon: '📋', label: 'Create Plan' },
  { to: '/test-cases', icon: '🧪', label: 'Create Cases'},
  { to: '/history',    icon: '📁', label: 'History'     },
]

const toolItems = [
  { to: '/connectors', icon: '🔌', label: 'Integrations' },
]

export default function App() {
  const location = useLocation()
  const [llmLabel, setLlmLabel] = useState('OpenAI GPT-4o')

  useEffect(() => {
    const connections = JSON.parse(localStorage.getItem('connections') || '{}')
    const llm = connections.llm || {}
    if (llm.provider === 'openai') setLlmLabel('OpenAI GPT-4o')
    else if (llm.provider === 'anthropic') setLlmLabel('Claude 3.5 Sonnet')
    else if (llm.provider === 'groq') setLlmLabel(`Groq: ${llm.groqModel || 'llama-3.3-70b-versatile'}`)
    else if (llm.provider === 'ollama') setLlmLabel(`Ollama: ${llm.ollamaModel || 'llama3'}`)
    else if (llm.provider === 'gemini') setLlmLabel(`Gemini: ${llm.geminiModel || 'gemini-1.5-flash'}`)
    else if (llm.provider === 'custom') setLlmLabel(`Custom API: ${llm.customModel || 'local-model'}`)
    else setLlmLabel('OpenAI GPT-4o')
  }, [location])


  return (
    <div className="app-layout">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎯</div>
          <div className="sidebar-logo-text">
            <span className="brand">TestOrchestrator</span>
            <span className="tagline">BLAST Framework • AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main</span>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <span className="sidebar-section-label">Configuration</span>
          {toolItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="llm-badge">
            <div className="dot" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>AI Active</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{llmLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="main-content">
        <div className="page-body">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/fetch"      element={<StoryFetcher />} />
            <Route path="/create"     element={<TestPlanCreator />} />
            <Route path="/test-cases" element={<TestCaseCreator />} />
            <Route path="/history"    element={<History />} />
            <Route path="/connectors" element={<Connectors />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
