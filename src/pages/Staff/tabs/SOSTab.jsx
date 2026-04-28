import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function SOSTab({ onNewSOS }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select(`id,created_at,resolved_at,
                   reservations(guest_name,room_number)`)
          .order('created_at', { ascending: false })
          .limit(50)

        if (!error && data) {
          setAlerts(data)
        }
      } catch (err) {
        console.error('Failed to load SOS alerts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('sos_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_alerts',
        },
        (payload) => {
          setAlerts((prev) => [payload.new, ...prev])
          onNewSOS()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [onNewSOS])

  const handleMarkResolved = async (alertId) => {
    try {
      await supabase
        .from('sos_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: 'staff',
        })
        .eq('id', alertId)

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, resolved_at: new Date().toISOString() }
            : alert
        )
      )
    } catch (err) {
      console.error('Failed to mark resolved:', err)
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="tab-loading">Loading SOS alerts...</div>
  }

  const activeAlerts = alerts.filter((a) => !a.resolved_at)
  const resolvedAlerts = alerts.filter((a) => a.resolved_at)

  return (
    <div className="tab-view sos-tab">
      <h2 className="tab-title">SOS Alerts</h2>

      {activeAlerts.length === 0 && resolvedAlerts.length === 0 ? (
        <div className="empty-state">
          <p>No SOS alerts</p>
        </div>
      ) : (
        <>
          {activeAlerts.length > 0 && (
            <div className="sos-section">
              <h3 className="sos-section-title active">Active ({activeAlerts.length})</h3>
              <div className="sos-list">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="sos-card active">
                    <div className="sos-header">
                      <div className="sos-info">
                        <h4 className="sos-guest">
                          {alert.reservations?.guest_name}
                        </h4>
                        <span className="sos-room">
                          Room {alert.reservations?.room_number}
                        </span>
                      </div>
                      <span className="sos-time">
                        {formatTime(alert.created_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkResolved(alert.id)}
                      className="resolve-btn"
                    >
                      Mark Resolved
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolvedAlerts.length > 0 && (
            <div className="sos-section">
              <h3 className="sos-section-title resolved">
                Resolved ({resolvedAlerts.length})
              </h3>
              <div className="sos-list">
                {resolvedAlerts.map((alert) => (
                  <div key={alert.id} className="sos-card resolved">
                    <div className="sos-header">
                      <div className="sos-info">
                        <h4 className="sos-guest">
                          {alert.reservations?.guest_name}
                        </h4>
                        <span className="sos-room">
                          Room {alert.reservations?.room_number}
                        </span>
                      </div>
                      <span className="sos-time">
                        {formatTime(alert.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
