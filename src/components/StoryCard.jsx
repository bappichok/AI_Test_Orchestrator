export default function StoryCard({ story, compact = false }) {
  if (!story) return null;

  const priorityClass = `priority-${(story.priority || 'Medium').toLowerCase()}`

  if (compact) {
    return (
      <div className="card" style={{ marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--grad-primary)' }} />
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary)', filter: 'blur(40px)', opacity: 0.1, borderRadius: '50%' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>📋 Story Context</div>
            <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="story-id" style={{ fontSize: '13px', padding: '4px 10px', background: 'var(--bg-elevated)', borderRadius: '100px' }}>{story.id}</span>
              <span>{story.title}</span>
            </div>
            {story.description && (
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '85%' }}>
                {story.description.substring(0, 150)}
                {story.description.length > 150 ? '...' : ''}
              </div>
            )}
          </div>
          <div style={{ fontSize: '24px' }}>🎯</div>
        </div>
      </div>
    )
  }

  // Full Story Card View
  return (
    <div className="story-card">
      <div className="story-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="story-id">{story.id}</span>
            <span className={`badge ${priorityClass}`}>{story.priority || 'Medium'}</span>
            <span className="badge badge-muted">{story.type || 'Requirement'}</span>
          </div>
          <div className="story-title">{story.title}</div>
          <div className="story-meta">
            {story.epic && <span className="tag badge badge-info" style={{ fontSize: '10px' }}>📁 {story.epic}</span>}
            {story.assignee && <span className="tag badge badge-muted" style={{ fontSize: '10px' }}>👤 {story.assignee}</span>}
            {story.status  && <span className="tag badge badge-muted" style={{ fontSize: '10px' }}>🔄 {story.status}</span>}
            {story.labels?.map(l => <span key={l} className="tag badge badge-info" style={{ fontSize: '10px' }}># {l}</span>)}
          </div>
        </div>
      </div>
      <div className="story-body">
        {story.flags && story.flags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {story.flags.map(f => (
              <div key={f} className="flag-warning">
                ⚠️ <strong>{f === 'MISSING_AC' ? 'Missing Acceptance Criteria' : 'Vague Description'}</strong>
              </div>
            ))}
          </div>
        )}
        
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
