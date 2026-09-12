import { useState } from 'react'
import { supabase } from './supabaseClient'
import AdminDashboard from './AdminDashboard'
import TrackComplaint from './TrackComplaint'
import './App.css'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function categorizeComplaint(description) {
  const prompt = `Classify this citizen complaint. Categories: Roads, Water Supply, Electricity, Sanitation, Public Safety, Healthcare, Education, Other.
Return ONLY valid JSON, no markdown, no explanation, in this exact format:
{"category": "...", "priority": "Low|Medium|High", "estimated_resolution_days": number}

Complaint: "${description}"`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  )

  const data = await response.json()
  console.log('Gemini response:', data)

  if (!response.ok || !data.candidates) {
    throw new Error('AI service temporarily unavailable, please try again')
  }

  const text = data.candidates[0].content.parts[0].text
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

function App() {
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_contact: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [view, setView] = useState('citizen')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('Analyzing complaint...')

    try {
      const aiResult = await categorizeComplaint(formData.description)

      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          ...formData,
          category: aiResult.category,
          priority: aiResult.priority,
          estimated_resolution_days: aiResult.estimated_resolution_days
        }])
        .select()

      if (error) throw error

      setMessage(
        `Complaint submitted! ID: ${data[0].id} | Category: ${aiResult.category} | Priority: ${aiResult.priority} | Est. ${aiResult.estimated_resolution_days} days`
      )
      setFormData({ citizen_name: '', citizen_contact: '', description: '' })
    } catch (err) {
      console.error(err)
      setMessage('Error: ' + err.message)
    }

    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ marginBottom: '2px' }}>🏛️ Samadhan AI</h1>
        <p style={{ color: '#94a3b8', marginTop: 0, fontSize: '14px' }}>
          AI-Powered Citizen Grievance Management
        </p>
      </div>

      <div className="nav-bar" style={{ justifyContent: 'center' }}>
        <button
          className={view === 'citizen' ? 'active' : ''}
          onClick={() => setView('citizen')}
        >
          📝 File a Complaint
        </button>
        <button
          className={view === 'track' ? 'active' : ''}
          onClick={() => setView('track')}
        >
          🔍 Track Complaint
        </button>
        <button
          className={view === 'admin' ? 'active' : ''}
          onClick={() => setView('admin')}
        >
          📊 Admin Dashboard
        </button>
      </div>

      {view === 'admin' ? (
        <AdminDashboard />
      ) : view === 'track' ? (
        <TrackComplaint />
      ) : (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label>Your Name</label><br />
              <input
                type="text"
                name="citizen_name"
                value={formData.citizen_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Contact (phone or email)</label><br />
              <input
                type="text"
                name="citizen_contact"
                value={formData.citizen_contact}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Describe your complaint</label><br />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>

          {message && <p style={{ marginTop: '15px' }}>{message}</p>}
        </div>
      )}
    </div>
  )
}

export default App