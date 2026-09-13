import Logo from './Logo'

function Landing({ onEnter }) {
  return (
    <div className="landing-screen">
      <div className="landing-content">
        <div className="landing-icon"><Logo size={64} /></div>
        <h1 className="landing-title">Samadhan AI</h1>
        <p className="landing-tagline">AI-Powered Citizen Grievance Management</p>
        <button className="landing-button" onClick={onEnter}>
          Click to Open →
        </button>
      </div>
    </div>
  )
}

export default Landing