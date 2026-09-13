import { useState, useRef } from 'react'
import { supabase } from './supabaseClient'
import AdminDashboard from './AdminDashboard'
import TrackComplaint from './TrackComplaint'
import Landing from './Landing'
import Logo from './Logo'
import './App.css'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function callGemini(description) {
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
  console.log('Gemini response:', response.status, data)

  if (!response.ok || !data.candidates) {
    const reason = data?.error?.message || `HTTP ${response.status}`
    throw new Error(reason)
  }

  const text = data.candidates[0].content.parts[0].text
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

async function categorizeComplaint(description) {
  const delays = [1500, 3000, 5000]
  let lastError

  for (let attempt = 0; attempt < delays.length; attempt++) {
    try {
      return await callGemini(description)
    } catch (err) {
      lastError = err
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delays[attempt]}ms:`, err.message)
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
    }
  }

  try {
    return await callGemini(description)
  } catch (err) {
    console.error('All retries failed:', err.message)
    throw lastError
  }
}

async function uploadImage(file) {
  const fileName = `${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('complaint-images')
    .upload(fileName, file)

  if (error) throw error

  const { data } = supabase.storage
    .from('complaint-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}

function App() {
  const [entered, setEntered] = useState(false)
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_contact: '',
    address: '',
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [view, setView] = useState('citizen')

  if (!entered) {
    return <Landing onEnter={() => setEntered(true)} />
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('Analyzing complaint...')

    try {
      let imageUrl = null
      if (selectedFile) {
        setMessage('Uploading photo...')
        imageUrl = await uploadImage(selectedFile)
      }

      setMessage('Analyzing complaint...')

      let aiResult = null
      let aiFailed = false
      try {
        aiResult = await categorizeComplaint(formData.description)
      } catch (err) {
        console.error('AI categorization failed after retries:', err.message)
        aiFailed = true
      }

      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          ...formData,
          image_url: imageUrl,
          category: aiResult?.category || null,
          priority: aiResult?.priority || null,
          estimated_resolution_days: aiResult?.estimated_resolution_days || null
        }])
        .select()

      if (error) throw error

      if (aiFailed) {
        setMessage(
          `Complaint submitted! ID: ${data[0].id}. AI analysis is temporarily delayed — your complaint is saved and will be categorized shortly. An admin can also assign it manually.`
        )
      } else {
        setMessage(
          `Complaint submitted! ID: ${data[0].id} | Category: ${aiResult.category} | Priority: ${aiResult.priority} | Est. ${aiResult.estimated_resolution_days} days`
        )
      }

      setFormData({ citizen_name: '', citizen_contact: '', address: '', description: '' })
      setSelectedFile(null)
      e.target.reset()
    } catch (err) {
      console.error(err)
      setMessage('Error: ' + err.message)
    }

    setSubmitting(false)
  }

  return (
    <div className="app-shell">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Logo size={32} />
          <h1 style={{ margin: 0, color: '#f1f5f9' }}>Samadhan AI</h1>
        </div>
        <p style={{ color: '#94a3b8', marginTop: '6px', fontSize: '14px' }}>
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
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label>Your Name</label><br />
              <input
                type="text"
                name="citizen_name"
                value={formData.citizen_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Contact (phone or email)</label><br />
              <input
                type="text"
                name="citizen_contact"
                value={formData.citizen_contact}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Address / Location of the issue</label><br />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Near XYZ Market, Ward 5"
                style={{ width: '100%', padding: '10px' }}
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
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Photo of the issue (optional)</label><br />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontWeight: 'normal',
                  textAlign: 'center'
                }}
              >
                {selectedFile ? `📎 ${selectedFile.name}` : '📷 Tap to choose a photo'}
              </button>
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