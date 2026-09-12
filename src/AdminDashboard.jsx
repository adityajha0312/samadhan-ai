import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

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

  const priorityColor = (priority) => {
    if (priority === 'High') return '#ff6b6b'
    if (priority === 'Medium') return '#ffd93d'
    return '#6bcf7f'
  }
  const isEscalated = (c) => {
  if (c.status === 'resolved') return false
  if (!c.estimated_resolution_days || !c.created_at) return false
  const daysSinceCreated = (Date.now() - new Date(c.created_at + 'Z').getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreated > c.estimated_resolution_days
}

  if (loading) return <p style={{ padding: '20px' }}>Loading complaints...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
  <div className="stat-card">
    <div className="stat-number">{complaints.length}</div>
    <div className="stat-label">Total</div>
  </div>
  <div className="stat-card">
    <div className="stat-number">{complaints.filter(c => c.status === 'resolved').length}</div>
    <div className="stat-label">Resolved</div>
  </div>
  <div className="stat-card">
    <div className="stat-number">{complaints.filter(c => c.status === 'in_progress').length}</div>
    <div className="stat-label">In Progress</div>
  </div>
  <div className="stat-card">
    <div className="stat-number" style={{ color: '#ff6b6b' }}>
      {complaints.filter(c => isEscalated(c)).length}
    </div>
    <div className="stat-label">Escalated</div>
  </div>
</div>
      <button onClick={fetchComplaints} style={{ marginBottom: '15px' }}>Refresh</button>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #555', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>ID</th>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Description</th>
              <th style={{ padding: '8px' }}>Category</th>
              <th style={{ padding: '8px' }}>Priority</th>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Est. Days</th>
              <th style={{ padding: '8px' }}>Update</th>
              <th style={{ padding: '8px' }}>Escalation</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', fontSize: '10px', wordBreak: 'break-all', maxWidth: '120px' }}>{c.id}</td>
                <td style={{ padding: '8px' }}>{c.citizen_name}</td>
                <td style={{ padding: '8px', maxWidth: '250px' }}>{c.description}</td>
                <td style={{ padding: '8px' }}>{c.category}</td>
                <td style={{ padding: '8px', color: priorityColor(c.priority), fontWeight: 'bold' }}>
                  {c.priority}
                </td>
                <td style={{ padding: '8px' }}>{c.status}</td>
                <td style={{ padding: '8px' }}>{c.estimated_resolution_days}</td>
                <td style={{ padding: '8px' }}>
                  <select
                    value={c.status}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td style={{ padding: '8px' }}>
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