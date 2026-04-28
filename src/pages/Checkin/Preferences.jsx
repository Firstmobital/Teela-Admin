import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { callEdgeFunction, getToken } from '../../lib/supabaseClient'

const PILLOW_OPTIONS = ['Soft', 'Medium', 'Firm']
const WAKEUP_OPTIONS = ['No thanks', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM']
const DIETARY_OPTIONS = ['Jain', 'Gluten-free', 'No onion-garlic', 'Diabetic', 'Low-sodium']

export default function Preferences() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [pillow, setPillow] = useState('')
  const [wakeup, setWakeup] = useState('')
  const [dietary, setDietary] = useState([])
  const [requests, setRequests] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDietaryToggle = (option) => {
    setDietary((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = tokenParam || getToken()
      if (!token) {
        throw new Error('No token available')
      }

      await callEdgeFunction('preferences', {
        token,
        pillow_preference: pillow || null,
        wakeup_time: wakeup || null,
        dietary_tags: dietary.length > 0 ? dietary : null,
        special_requests: requests || null,
      })

      navigate(`/stay/${token}/welcome`)
    } catch (err) {
      setError(err.message || 'Failed to save preferences.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stay-screen preferences">
      <div className="stay-container">
        <button className="stay-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="stay-content">
          <h1 className="stay-title">Personalise your stay</h1>
          <p className="stay-subtitle">Help us tailor your experience</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="stay-form preferences-form">
            {/* Pillow preference */}
            <div className="form-group">
              <label htmlFor="pillow">Pillow preference</label>
              <select
                id="pillow"
                value={pillow}
                onChange={(e) => setPillow(e.target.value)}
                className="form-input"
              >
                <option value="">Select a preference</option>
                {PILLOW_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Wake-up call */}
            <div className="form-group">
              <label htmlFor="wakeup">Wake-up call</label>
              <select
                id="wakeup"
                value={wakeup}
                onChange={(e) => setWakeup(e.target.value)}
                className="form-input"
              >
                <option value="">Select a time</option>
                {WAKEUP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Dietary restrictions */}
            <div className="form-group">
              <label>Dietary restrictions</label>
              <div className="chips-group">
                {DIETARY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleDietaryToggle(option)}
                    className={`chip ${dietary.includes(option) ? 'chip-selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Special requests */}
            <div className="form-group">
              <label htmlFor="requests">Special requests</label>
              <textarea
                id="requests"
                value={requests}
                onChange={(e) => setRequests(e.target.value.slice(0, 300))}
                placeholder="Let us know if there's anything else..."
                maxLength={300}
                rows={4}
                className="form-input"
              />
              <div className="char-count">{requests.length} / 300</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="stay-btn stay-btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
