import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, getToken } from '../../lib/supabaseClient'

export default function Welcome() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [guestInfo, setGuestInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGuestInfo = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token) {
          navigate('/stay/verify')
          return
        }

        const { data, error } = await supabase
          .from('reservations')
          .select('guest_name,room_number,checkin_date,checkout_date')
          .eq('unique_token', token)
          .single()

        if (error || !data) {
          navigate('/stay/verify')
          return
        }

        setGuestInfo(data)
      } catch (err) {
        console.error(err)
        navigate('/stay/verify')
      } finally {
        setLoading(false)
      }
    }

    loadGuestInfo()
  }, [navigate, tokenParam])

  if (loading) {
    return (
      <div className="stay-screen welcome">
        <div className="stay-container">
          <div className="stay-content">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!guestInfo) {
    return null
  }

  const handleExplore = () => {
    const token = tokenParam || getToken()
    navigate(`/stay/${token}/home`)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="stay-screen welcome">
      <div className="stay-container welcome-container">
        <div className="stay-content welcome-content">
          <h1 className="welcome-title">
            Welcome{guestInfo.guest_name ? ` back, ${guestInfo.guest_name}` : ''}
          </h1>

          <div className="welcome-info">
            <div className="info-item">
              <span className="info-label">Room</span>
              <span className="info-value">{guestInfo.room_number}</span>
            </div>
            <div className="info-divider"></div>
            <div className="info-item">
              <span className="info-label">Check-in</span>
              <span className="info-value">{formatDate(guestInfo.checkin_date)}</span>
            </div>
            <div className="info-divider"></div>
            <div className="info-item">
              <span className="info-label">Check-out</span>
              <span className="info-value">{formatDate(guestInfo.checkout_date)}</span>
            </div>
          </div>

          <p className="welcome-subtext">Your stay at Teela begins now.</p>

          <button
            onClick={handleExplore}
            className="stay-btn stay-btn-primary stay-btn-large"
          >
            Explore your stay
          </button>
        </div>
      </div>
    </div>
  )
}
