import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const navItems = [
  { to: '/',            icon: '⚡', label: 'Dashboard'  },
  { to: '/fetch',       icon: '🔍', label: 'Fetch Story' },
  { to: '/create',      icon: '📋', label: 'Create Plan' },
  { to: '/test-cases',  icon: '🧪', label: 'Create Cases'},
  { to: '/generate-code', icon: '🤖', label: 'Generate Code' },
  { to: '/analytics',   icon: '📊', label: 'QA Dashboard' },
  { to: '/history',     icon: '📁', label: 'History'     },
]

const toolItems = [
  { to: '/connectors', icon: '🔌', label: 'Integrations' },
]

export default function MainLayout() {
  const { theme, toggleTheme, llmLabel } = useApp()

  return (
    <div className="app-layout">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎯</div>
          <div className="sidebar-logo-text" style={{ flex: 1 }}>
            <span className="brand">TestOrchestrator</span>
            <span className="tagline">BLAST Framework • AI</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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

        <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="llm-badge">
            <div className="dot" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>AI Active</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{llmLabel}</div>
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={toggleTheme} title="Toggle Theme" style={{ fontSize: 18 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* ── Main Routing Block ───────────────────────── */}
      <main className="main-content">
        <div className="page-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
