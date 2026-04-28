import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, getToken, callEdgeFunction } from '../../lib/supabaseClient'
import SOSModal from './SOSModal'

const TILES = [
  {
    id: 'activities',
    icon: '🌿',
    label: 'Activities',
    route: '/stay/:token/activities',
  },
  {
    id: 'menu',
    icon: '🍽',
    label: 'Order food',
    route: '/stay/:token/menu',
  },
  {
    id: 'chat',
    icon: '💬',
    label: 'Chat',
    route: '/stay/:token/chat',
  },
  {
    id: 'bill',
    icon: '🧾',
    label: 'My bill',
    route: '/stay/:token/bill',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [guestInfo, setGuestInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [sosLoading, setSOSLoading] = useState(false)
  const [greeting, setGreeting] = useState('Good morning')
  const sosTimerRef = useRef(null)
  const sosStartRef = useRef(null)

  useEffect(() => {
    const loadGuestInfo = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token) {
          navigate('/stay/verify', { replace: true })
          return
        }

        const { data, error } = await supabase
          .from('reservations')
          .select('guest_name,room_number,checkin_date,checkout_date')
          .eq('unique_token', token)
          .single()

        if (error || !data) {
          navigate('/stay/verify', { replace: true })
          return
        }

        setGuestInfo(data)
      } catch (err) {
        console.error(err)
        navigate('/stay/verify', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    loadGuestInfo()

    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 18) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }
  }, [navigate, tokenParam])

  const handleTileClick = (route) => {
    const token = tokenParam || getToken()
    navigate(route.replace(':token', token))
  }

  const calculateNights = () => {
    if (!guestInfo) return 0
    const checkin = new Date(guestInfo.checkin_date)
    const checkout = new Date(guestInfo.checkout_date)
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24))
    return nights
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const handleSOSStart = (e) => {
    if (e.type === 'mousedown' || e.type === 'touchstart') {
      sosStartRef.current = Date.now()
      sosTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - sosStartRef.current
        const progressPercent = (elapsed / 3000) * 100

        if (progressPercent >= 100) {
          clearInterval(sosTimerRef.current)
          handleSOSConfirm()
        }

        // Update progress visually
        const btn = document.querySelector('.sos-btn')
        if (btn) {
          btn.style.setProperty('--sos-progress', `${progressPercent}%`)
        }
      }, 50)
    }
  }

  const handleSOSEnd = () => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current)
      const btn = document.querySelector('.sos-btn')
      if (btn) {
        btn.style.setProperty('--sos-progress', '0%')
      }
    }
  }

  const handleSOSConfirm = async () => {
    handleSOSEnd()
    setSOSLoading(true)

    try {
      const token = tokenParam || getToken()
      if (!token) throw new Error('No token')

      await callEdgeFunction('sos', { token })
      setShowSOSModal(true)
    } catch (err) {
      console.error('SOS failed:', err)
      alert('Failed to send SOS. Please call reception.')
    } finally {
      setSOSLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!guestInfo) {
    return null
  }

  return (
    <div className="dashboard">
      {/* Top bar */}
      <div className="dashboard-topbar">
        <div className="topbar-left">
          <span className="teela-logo">TEELA</span>
        </div>
        <div className="topbar-right">
          <span className="room-badge">{guestInfo.room_number}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-content">
        {/* Greeting */}
        <h1 className="dashboard-greeting">
          {greeting}, {guestInfo.guest_name}
        </h1>

        {/* Stay info card */}
        <div className="stay-card">
          <div className="stay-card-row">
            <div className="stay-card-item">
              <span className="stay-card-label">Check-in</span>
              <span className="stay-card-value">{formatDate(guestInfo.checkin_date)}</span>
            </div>
            <div className="stay-card-divider"></div>
            <div className="stay-card-item">
              <span className="stay-card-label">{calculateNights()} nights</span>
              <span className="stay-card-value">Stay</span>
            </div>
            <div className="stay-card-divider"></div>
            <div className="stay-card-item">
              <span className="stay-card-label">Check-out</span>
              <span className="stay-card-value">{formatDate(guestInfo.checkout_date)}</span>
            </div>
          </div>
        </div>

        {/* Tiles grid */}
        <div className="tiles-grid">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.route)}
              className="tile"
            >
              <span className="tile-icon">{tile.icon}</span>
              <span className="tile-label">{tile.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SOS Button */}
      <div className="sos-container">
        <button
          className="sos-btn"
          onMouseDown={handleSOSStart}
          onMouseUp={handleSOSEnd}
          onMouseLeave={handleSOSEnd}
          onTouchStart={handleSOSStart}
          onTouchEnd={handleSOSEnd}
          disabled={sosLoading}
        >
          <span className="sos-progress-ring"></span>
          <span className="sos-text">HOLD FOR SOS</span>
        </button>
      </div>

      {/* SOS Modal */}
      {showSOSModal && (
        <SOSModal
          roomNumber={guestInfo.room_number}
          onClose={() => setShowSOSModal(false)}
        />
      )}
    </div>
  )
}
