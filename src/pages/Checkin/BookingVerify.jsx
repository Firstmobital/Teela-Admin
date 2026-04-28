import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { callEdgeFunction } from '../../lib/supabaseClient'

export default function BookingVerify() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [bookingRef, setBookingRef] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await callEdgeFunction('checkin', {
        booking_ref: bookingRef,
        mobile: mobile,
      })

      // Navigate to preferences with the new token
      navigate(`/stay/${response.token}/preferences`)
    } catch (err) {
      setError('Booking not found. Please call reception.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stay-screen booking-verify">
      <div className="stay-container">
        <div className="stay-content">
          <h1 className="stay-title">Welcome to Teela</h1>
          <p className="stay-subtitle">Let's get you checked in</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="stay-form">
            <div className="form-group">
              <label htmlFor="booking-ref">Booking reference</label>
              <input
                id="booking-ref"
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                placeholder="E.g. TEE-2024-1109"
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile number</label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit number"
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="stay-btn stay-btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify booking'
              )}
            </button>
          </form>

          <p className="stay-help-text">
            Need help? Contact reception at ext. 0 or visit the front desk.
          </p>
        </div>
      </div>
    </div>
  )
}
