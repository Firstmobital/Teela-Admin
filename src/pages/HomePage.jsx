import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../lib/supabaseClient'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const navigate = useNavigate()
  const [guestInfo, setGuestInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadGuestInfo = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate('/checkin', { replace: true })
          return
        }

        // Fetch guest info from reservations table
        const { data, error: queryError } = await supabase
          .from('reservations')
          .select('guest_name,room_number,checkin_date,checkout_date')
          .eq('unique_token', token)
          .single()

        if (queryError || !data) {
          setError('Failed to load guest information')
          return
        }

        setGuestInfo(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadGuestInfo()
  }, [navigate])

  const handleLogout = () => {
    clearToken()
    navigate('/checkin', { replace: true })
  }

  if (loading) {
    return (
      <section className="home-page">
        <p>Loading your information...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="home-page">
        <div className="error-message">{error}</div>
        <button onClick={handleLogout} className="logout-btn">
          Check in again
        </button>
      </section>
    )
  }

  return (
    <section className="home-page">
      <h2>Welcome{guestInfo?.guest_name ? ` back, ${guestInfo.guest_name}` : ''}!</h2>
      <p>Book activities, order services, and manage your stay in one app.</p>

      {guestInfo && (
        <div className="guest-info-card">
          <div className="info-row">
            <span className="label">Room:</span>
            <span className="value">{guestInfo.room_number}</span>
          </div>
          <div className="info-row">
            <span className="label">Check-in:</span>
            <span className="value">
              {new Date(guestInfo.checkin_date).toLocaleDateString()}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Check-out:</span>
            <span className="value">
              {new Date(guestInfo.checkout_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="action-btn">Activities</button>
        <button className="action-btn">Order food</button>
        <button className="action-btn">My folio</button>
        <button className="action-btn danger">SOS</button>
      </div>

      <button onClick={handleLogout} className="logout-btn">
        Log out
      </button>
    </section>
  )
}
