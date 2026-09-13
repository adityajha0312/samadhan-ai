import { useState } from 'react'
import { supabase } from './supabaseClient'

function TrackComplaint() {
  const [complaintId, setComplaintId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTrack = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const { data, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('ref_code', complaintId.trim().toUpperCase())
      .single()

    setLoading(false)

    if (fetchError || !data) {
      setError('No complaint found with that ID. Please check and try again.')
    } else {
      setResult(data)
    }
  }

  const statusLabel = (status) => {
    if (status === 'resolved') return 'Resolved'
    if (status === 'in_progress') return 'In Progress'
    return 'Submitted'
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1>Track Your Complaint</h1>
      <form onSubmit={handleTrack}>
        <label>Enter your Reference Code</label><br />
        <input
          type="text"
          value={complaintId}
          onChange={(e) => setComplaintId(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Track Complaint'}
        </button>
      </form>

      {error && <p style={{ color: '#ff6b6b', marginTop: '15px' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #555', borderRadius: '6px' }}>
          <p><strong>Status:</strong> {statusLabel(result.status)}</p>
          <p><strong>Category:</strong> {result.category || 'Pending analysis'}</p>
          <p><strong>Priority:</strong> {result.priority || 'Pending analysis'}</p>
          <p><strong>Estimated Resolution:</strong> {result.estimated_resolution_days ? `${result.estimated_resolution_days} days` : 'N/A'}</p>
          <p><strong>Address:</strong> {result.address || 'Not provided'}</p>
          <p><strong>Description:</strong> {result.description}</p>
          {result.image_url && (
            <p>
              <strong>Photo:</strong><br />
              <img src={result.image_url} alt="complaint" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px' }} />
            </p>
          )}
          <p><strong>Submitted:</strong> {new Date(result.created_at + 'Z').toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}

export default TrackComplaint