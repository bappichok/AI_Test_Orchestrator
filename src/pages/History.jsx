import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'

export default function History() {
  const navigate  = useNavigate()
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]   = useState('')
  const [activeTab, setActiveTab] = useState('preview')

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('testPlanHistory') || '[]')
    setHistory(h)
    if (h.length > 0) setSelected(h[0])
  }, [])

  const filtered = history.filter(h =>
    !filter ||
    h.story?.id?.toLowerCase().includes(filter.toLowerCase()) ||
    h.story?.title?.toLowerCase().includes(filter.toLowerCase())
  )

  const deleteItem = (idx) => {
    const next = history.filter((_, i) => i !== idx)
    setHistory(next)
    localStorage.setItem('testPlanHistory', JSON.stringify(next))
    setSelected(next[0] || null)
  }

  const exportMd = (item) => {
    const blob = new Blob([item.testPlan], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TestPlan-${item.story?.id}-${Date.now()}.md`
    a.click()
  }

  const exportDocx = async (item) => {
    try {
      const resp = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: item.testPlan, title: `TestPlan-${item.story?.id}` })
      })
      if (!resp.ok) throw new Error('Export failed')
      
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TestPlan-${item.story?.id}-${Date.now()}.docx`
      a.click()
    } catch (e) {
      alert('Failed to export DOCX')
    }
  }

  if (history.length === 0) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="page-header">
          <h1>📁 History</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No test plans yet</div>
          <div className="empty-desc">Generate your first test plan and it will appear here.</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/fetch')}>
            🔍 Fetch a Story
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div className="breadcrumb"><span>Home</span><span className="sep">/</span><span>History</span></div>
        <h1>📁 Test Plan History</h1>
        <p>{history.length} test plan{history.length !== 1 ? 's' : ''} generated</p>
      </div>

      <div className="split-layout">
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search by ID or title…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          {filtered.map((item, i) => (
            <div
              key={i}
              onClick={() => { setSelected(item); setActiveTab('preview') }}
              style={{
                padding: '14px 16px',
                background: selected === item ? 'var(--primary-glow)' : 'var(--bg-card)',
                border: `1px solid ${selected === item ? 'var(--border-focus)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--primary-light)', fontWeight: 600 }}>{item.story?.id}</span>
                    <span className={`badge priority-${item.story?.priority?.toLowerCase()}`}>{item.story?.priority}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                    {item.story?.title?.substring(0, 50)}{item.story?.title?.length > 50 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={e => { e.stopPropagation(); deleteItem(i) }}
                  style={{ padding: '4px 8px', fontSize: 14, flexShrink: 0 }}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        {selected ? (
          <div className="test-plan-preview">
            <div className="test-plan-toolbar">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  {selected.story?.id} — {selected.story?.title?.substring(0, 40)}…
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setActiveTab('preview')}
                >👁 Preview</button>
                <button
                  className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setActiveTab('raw')}
                >📝 Raw</button>
                <button className="btn btn-primary btn-sm" onClick={() => exportDocx(selected)}>📥 DOCX</button>
                <button className="btn btn-secondary btn-sm" onClick={() => exportMd(selected)}>📝 MD</button>
              </div>
            </div>
            {activeTab === 'preview'
              ? <div className="test-plan-content" dangerouslySetInnerHTML={{ __html: marked.parse(selected.testPlan || '') }} />
              : (
                <div className="test-plan-content">
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {selected.testPlan}
                  </pre>
                </div>
              )
            }
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">👈</div>
              <div className="empty-title">Select a plan</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
