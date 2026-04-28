import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { callEdgeFunction, getToken } from '../lib/supabaseClient'

export default function CheckinPage() {
  const navigate = useNavigate()
  const [bookingRef, setBookingRef] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If user already has a token, redirect to home
  const existingToken = getToken()
  if (existingToken) {
    navigate('/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await callEdgeFunction('checkin', {
        booking_ref: bookingRef,
        mobile: mobile,
      })

      // Navigate to home with token in URL
      navigate(`/?token=${response.token}`)
    } catch (err) {
      setError(err.message || 'Check-in failed. Please verify your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkin-page">
      <section className="checkin-card">
        <h2>Welcome to Teela</h2>
        <p>Enter your booking details to check in.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="booking-ref">Booking reference</label>
            <input
              id="booking-ref"
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              placeholder="Enter your booking reference"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile number</label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter your mobile number"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Checking in...' : 'Check in'}
          </button>
        </form>
      </section>
    </div>
  )
}
