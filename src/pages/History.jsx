import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'

const CATEGORIES = [
  { id: 'plans', label: 'Test Plans', key: 'testPlanHistory', icon: '📋' },
  { id: 'cases', label: 'Test Cases', key: 'testCaseHistory', icon: '🧪' },
  { id: 'code',  label: 'Automation', key: 'automationHistory', icon: '🤖' },
]

export default function History() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('plans')
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState('preview')

  useEffect(() => {
    const category = CATEGORIES.find(c => c.id === activeCategory)
    const h = JSON.parse(localStorage.getItem(category.key) || '[]')
    setHistory(h)
    setSelected(h.length > 0 ? h[0] : null)
    setActiveTab('preview')
  }, [activeCategory])

  const filtered = history.filter(h =>
    !filter ||
    h.story?.id?.toLowerCase().includes(filter.toLowerCase()) ||
    h.story?.title?.toLowerCase().includes(filter.toLowerCase())
  )

  const deleteItem = (idx) => {
    const category = CATEGORIES.find(c => c.id === activeCategory)
    const next = history.filter((_, i) => i !== idx)
    setHistory(next)
    localStorage.setItem(category.key, JSON.stringify(next))
    setSelected(next[0] || null)
  }

  const exportItem = (item) => {
    let content = '', ext = 'md', name = 'artifact'
    try {
      if (activeCategory === 'plans') { 
        content = item.testPlan || ''; 
        name = `Plan-${item.story?.id || 'export'}`
      }
      else if (activeCategory === 'cases') { 
        content = JSON.stringify(item.testCases || [], null, 2); 
        ext = 'json'; 
        name = `Cases-${item.story?.id || 'export'}`
      }
      else if (activeCategory === 'code') { 
        content = item.code || ''; 
        ext = 'js'; 
        name = `Automation-${item.story?.id || 'export'}`
      }

      if (!content) {
        alert('No content available to export');
        return;
      }

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}-${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export artifact');
    }
  }

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '40px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            📁 ARCHIVE VAULT
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px 0', textShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: '1.1' }}>Execution History</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>Review, export, and audit all previously generated QA architectures and automated sequences.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 32, gap: 12, border: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '12px', padding: '12px 24px' }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="content-grid">
        {/* Left Column: List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search archives..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
            {filtered.length > 0 ? filtered.map((item, i) => (
              <div
                key={i}
                onClick={() => { setSelected(item); setActiveTab('preview') }}
                className="nav-item"
                style={{
                  padding: '16px',
                  background: selected === item ? 'var(--primary-glow)' : 'var(--bg-glass)',
                  border: `1px solid ${selected === item ? 'var(--primary-light)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>{item.story?.id || 'MANUAL'}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 8 }}>
                  {item.story?.title || 'Generated Content'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={`status-dot ok`} style={{ width: 6, height: 6 }} />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', color: 'var(--danger)' }}
                    onClick={e => { e.stopPropagation(); deleteItem(i) }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )) : (
              <div className="premium-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: 12 }}>📭</div>
                <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>No records found in this vector.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Previewer */}
        <div>
          {selected ? (
            <div className="premium-card" style={{ padding: 0 }}>
              <div className="test-plan-toolbar" style={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '20px 32px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{selected.story?.id} — Artifact Preview</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Compiled on {new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => exportItem(selected)}>📥 Export</button>
                </div>
              </div>

              <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                {activeCategory === 'plans' && (
                  <div className="test-plan-content" dangerouslySetInnerHTML={{ __html: marked.parse(selected.testPlan || '') }} />
                )}
                
                {activeCategory === 'cases' && (
                  <div className="grid-2">
                    {selected.testCases && selected.testCases.length > 0 ? (
                      selected.testCases.map((tc, idx) => (
                        <div key={idx} className="nav-item" style={{ padding: '20px', background: 'var(--bg-elevated)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary-light)' }}>{tc.id}</span>
                            <span className={`badge priority-${tc.priority?.toLowerCase()}`}>{tc.priority}</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{tc.title}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{tc.type}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center' }}>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>No test cases found in this artifact.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeCategory === 'code' && (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', background: 'var(--primary)', color: 'white', borderBottomLeftRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                      {selected.framework?.toUpperCase()}
                    </div>
                    <pre style={{ margin: 0, padding: '24px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.6', overflowX: 'auto' }}>
                      {selected.code}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: 24, opacity: 0.1 }}>📄</div>
              <h2>Command Center Idle</h2>
              <p style={{ maxWidth: '300px', opacity: 0.6 }}>Select an execution record from the left panel to inspect its high-fidelity architectural output.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
