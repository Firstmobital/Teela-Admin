import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentSession, signOut, isAdmin } from '../../lib/staffAuth'
import ArrivalsTab from './tabs/ArrivalsTab'
import OrdersTab from './tabs/OrdersTab'
import ChatsTab from './tabs/ChatsTab'
import ActivitiesTab from './tabs/ActivitiesTab'
import PreferencesTab from './tabs/PreferencesTab'
import SOSTab from './tabs/SOSTab'
import MenuMgmtTab from './tabs/MenuMgmtTab'

const TABS = [
  { id: 'arrivals', label: 'Arrivals', icon: '📋' },
  { id: 'orders', label: 'Orders', icon: '🍽' },
  { id: 'chats', label: 'Chats', icon: '💬' },
  { id: 'activities', label: 'Activities', icon: '🌿' },
  { id: 'preferences', label: 'Preferences', icon: '⭐' },
  { id: 'sos', label: 'SOS', icon: '🚨' },
]

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('arrivals')
  const [loading, setLoading] = useState(true)
  const sosAudioRef = useRef(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { session: currentSession } = await getCurrentSession()
        if (!currentSession) {
          navigate('/staff/login', { replace: true })
          return
        }
        setSession(currentSession)
      } catch (err) {
        console.error('Auth error:', err)
        navigate('/staff/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [navigate])

  const handleLogout = async () => {
    await signOut()
    navigate('/staff/login', { replace: true })
  }

  const playSOS = () => {
    if (!sosAudioRef.current) {
      // Create simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      )

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
  }

  if (loading) {
    return (
      <div className="staff-dashboard">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdminUser = isAdmin(session)

  const visibleTabs = isAdminUser
    ? [...TABS, { id: 'menu', label: 'Menu Mgmt', icon: '⚙️' }]
    : TABS

  const renderTab = () => {
    switch (activeTab) {
      case 'arrivals':
        return <ArrivalsTab />
      case 'orders':
        return <OrdersTab />
      case 'chats':
        return <ChatsTab />
      case 'activities':
        return <ActivitiesTab />
      case 'preferences':
        return <PreferencesTab />
      case 'sos':
        return <SOSTab onNewSOS={playSOS} />
      case 'menu':
        return isAdminUser ? <MenuMgmtTab /> : null
      default:
        return <ArrivalsTab />
    }
  }

  return (
    <div className="staff-dashboard">
      {/* Desktop sidebar */}
      <div className="staff-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Teela Staff</h1>
          <button onClick={handleLogout} className="logout-btn">
            🚪
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item ${activeTab === tab.id ? 'nav-item-active' : ''}`}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="staff-main">
        {/* Mobile header */}
        <div className="mobile-header">
          <h1 className="mobile-title">Teela Staff</h1>
          <button onClick={handleLogout} className="mobile-logout-btn">
            🚪
          </button>
        </div>

        {/* Tab content */}
        <div className="tab-content">{renderTab()}</div>

        {/* Mobile bottom nav */}
        <div className="mobile-nav">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mobile-nav-item ${
                activeTab === tab.id ? 'mobile-nav-item-active' : ''
              }`}
            >
              <span className="mobile-nav-icon">{tab.icon}</span>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden audio element for SOS beep */}
      <audio ref={sosAudioRef} />
    </div>
  )
}
