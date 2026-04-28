import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, getToken, callEdgeFunction } from '../../lib/supabaseClient'

export default function ActivityBook({ activity, onClose }) {
  const { token: tokenParam } = useParams()
  const [bookingDate, setBookingDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('morning')
  const [guestCount, setGuestCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checkoutDate, setCheckoutDate] = useState('')

  // Load checkout date from Supabase on mount
  useEffect(() => {
    const loadCheckoutDate = async () => {
      try {
        const token = tokenParam || getToken()
        const { data } = await supabase
          .from('reservations')
          .select('checkout_date')
          .eq('unique_token', token)
          .single()

        if (data) {
          setCheckoutDate(data.checkout_date)
          // Set initial booking date to today
          setBookingDate(new Date().toISOString().split('T')[0])
        }
      } catch (err) {
        console.error('Failed to load checkout date:', err)
      }
    }

    loadCheckoutDate()
  }, [tokenParam])

  const handleBook = async () => {
    if (!bookingDate) {
      setError('Please select a date')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = tokenParam || getToken()
      if (!token) throw new Error('No token')

      await callEdgeFunction('activity', {
        token,
        activity_id: activity.id,
        booking_date: bookingDate,
        time_slot: timeSlot,
        guest_count: guestCount,
      })

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to book activity. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const incrementGuests = () => {
    if (guestCount < activity.max_capacity) {
      setGuestCount(guestCount + 1)
    }
  }

  const decrementGuests = () => {
    if (guestCount > 1) {
      setGuestCount(guestCount - 1)
    }
  }

  const totalAmount =
    activity.price_per_person === null
      ? 0
      : activity.price_per_person * guestCount

  const minDate = new Date().toISOString().split('T')[0]
  const maxDate = checkoutDate || new Date().toISOString().split('T')[0]

  return (
    <div className="activity-book-overlay" onClick={onClose}>
      <div className="activity-book-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="book-sheet-header">
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
          <h2 className="book-sheet-title">{activity.name}</h2>
        </div>

        {success ? (
          <div className="book-sheet-content">
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h3 className="success-title">Booked!</h3>
              <p className="success-message">
                Charge added to your bill.
              </p>
              <button onClick={onClose} className="success-btn">
                Got it
              </button>
            </div>
          </div>
        ) : (
          <div className="book-sheet-content">
            {/* Activity details */}
            <div className="detail-section">
              <p className="activity-desc">{activity.description}</p>
              <div className="detail-row">
                <span className="detail-label">Price per person</span>
                <span className="detail-value">
                  {activity.price_per_person === null
                    ? 'Complimentary'
                    : `₹${activity.price_per_person}`}
                </span>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Date picker */}
            <div className="detail-section">
              <label className="form-label">Select date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="form-input date-input"
                disabled={loading}
              />
            </div>

            {/* Time slot */}
            <div className="detail-section">
              <label className="form-label">Time slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="form-input"
                disabled={loading}
              >
                <option value="morning">🌅 Morning (6:00 AM - 12:00 PM)</option>
                <option value="afternoon">🌤 Afternoon (12:00 PM - 6:00 PM)</option>
                <option value="evening">🌆 Evening (6:00 PM - 10:00 PM)</option>
              </select>
            </div>

            {/* Guest count */}
            <div className="detail-section">
              <label className="form-label">Number of guests</label>
              <div className="stepper">
                <button
                  onClick={decrementGuests}
                  disabled={guestCount <= 1 || loading}
                  className="stepper-btn"
                >
                  −
                </button>
                <input
                  type="number"
                  value={guestCount}
                  readOnly
                  className="stepper-input"
                />
                <button
                  onClick={incrementGuests}
                  disabled={guestCount >= activity.max_capacity || loading}
                  className="stepper-btn"
                >
                  +
                </button>
              </div>
              <span className="stepper-hint">
                Max {activity.max_capacity} guests
              </span>
            </div>

            {/* Total amount */}
            {activity.price_per_person !== null && (
              <div className="detail-section total-section">
                <div className="total-row">
                  <span className="total-label">Total amount</span>
                  <span className="total-value">₹{totalAmount}</span>
                </div>
              </div>
            )}

            {/* Confirm button */}
            <button
              onClick={handleBook}
              disabled={loading || !bookingDate}
              className="confirm-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Booking...
                </>
              ) : (
                'Confirm booking'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
