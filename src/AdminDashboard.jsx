import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const fetchComplaints = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setComplaints(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const updateStatus = async (id, newStatus) => {
    await supabase
      .from('complaints')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    fetchComplaints()
  }

  const copyId = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const priorityColor = (priority) => {
    if (priority === 'High') return '#ff6b6b'
    if (priority === 'Medium') return '#ffd93d'
    return '#6bcf7f'
  }

  const statusLabel = (status) => {
    if (status === 'resolved') return 'Resolved'
    return 'In Progress'
  }

  const isEscalated = (c) => {
    if (c.status === 'resolved') return false
    if (!c.estimated_resolution_days || !c.created_at) return false
    const daysSinceCreated = (Date.now() - new Date(c.created_at + 'Z').getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreated > c.estimated_resolution_days
  }

  const displayId = (c) => c.ref_code || c.id.slice(0, 8).toUpperCase()

  if (loading) return <p style={{ padding: '20px' }}>Loading complaints...</p>

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Dashboard</h1>
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="stat-card">
          <div className="stat-number">{complaints.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{complaints.filter(c => c.status === 'resolved').length}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{complaints.filter(c => c.status !== 'resolved').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ff6b6b' }}>
            {complaints.filter(c => isEscalated(c)).length}
          </div>
          <div className="stat-label">Escalated</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <button onClick={fetchComplaints}>Refresh</button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Description</th>
              <th style={{ padding: '10px' }}>Address</th>
              <th style={{ padding: '10px' }}>Photo</th>
              <th style={{ padding: '10px' }}>Category</th>
              <th style={{ padding: '10px' }}>Priority</th>
            
              <th style={{ padding: '10px' }}>Est. Days</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Escalation</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                <td
                  style={{ padding: '10px', fontSize: '12px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.5px' }}
                  title="Click to copy"
                  onClick={() => copyId(displayId(c))}
                >
                  {copiedId === displayId(c) ? 'Copied!' : displayId(c)}
                </td>
                <td style={{ padding: '10px' }}>{c.citizen_name}</td>
                <td style={{ padding: '10px', maxWidth: '220px' }}>{c.description}</td>
                <td style={{ padding: '10px', maxWidth: '150px' }}>{c.address || '—'}</td>
                <td style={{ padding: '10px' }}>
                  {c.image_url ? (
                    <a href={c.image_url} target="_blank" rel="noreferrer">
                      <img src={c.image_url} alt="complaint" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                    </a>
                  ) : '—'}
                </td>
                <td style={{ padding: '10px' }}>
                  {c.category || <span style={{ color: '#ffd93d' }}>⏳ Pending AI</span>}
                </td>
                <td style={{ padding: '10px', color: priorityColor(c.priority), fontWeight: 'bold' }}>
                  {c.priority}
                </td>
                
                <td style={{ padding: '10px' }}>{c.estimated_resolution_days}</td>
               <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: c.status === 'resolved' ? '#16653433' : '#7c3aed33',
                    color: c.status === 'resolved' ? '#6bcf7f' : '#c4b5fd'
                  }}>
                    {statusLabel(c.status)}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  {isEscalated(c) ? (
                    <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>⚠ ESCALATED</span>
                  ) : (
                    <span style={{ color: '#6bcf7f' }}>On Track</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard