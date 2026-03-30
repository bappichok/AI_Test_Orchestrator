import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="app-layout">
      {/* ── Mobile Branding & Toggle ─────────────────── */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo-icon" style={{ width: '32px', height: '32px', fontSize: '14px' }}>🎯</div>
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>TestOrchestrator</span>
        </div>
        <button 
          className="btn-icon btn-ghost" 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          style={{ fontSize: '24px' }}
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Sidebar Overlay (Mobile) ────────────────── */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
          <span className="sidebar-section-label">Main Navigation</span>
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
          <div className="llm-badge" style={{ flex: 1, marginRight: '10px' }}>
            <div className="dot" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Master</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{llmLabel}</div>
            </div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} style={{ flexShrink: 0 }}>
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
