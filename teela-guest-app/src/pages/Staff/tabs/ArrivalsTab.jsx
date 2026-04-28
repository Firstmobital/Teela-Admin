import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ArrivalsTab() {
  const [arrivals, setArrivals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArrivals = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('reservations')
          .select('id,guest_name,room_number,checkin_date,status')
          .eq('checkin_date', today)
          .order('room_number')

        if (!error && data) {
          setArrivals(data)
        }
      } catch (err) {
        console.error('Failed to load arrivals:', err)
      } finally {
        setLoading(false)
      }
    }

    loadArrivals()
  }, [])

  if (loading) {
    return <div className="tab-loading">Loading arrivals...</div>
  }

  return (
    <div className="tab-view arrivals-tab">
      <h2 className="tab-title">Today's Arrivals</h2>

      {arrivals.length === 0 ? (
        <div className="empty-state">
          <p>No arrivals today</p>
        </div>
      ) : (
        <div className="arrivals-list">
          {arrivals.map((reservation) => (
            <div key={reservation.id} className="arrival-card">
              <div className="arrival-header">
                <div className="arrival-info">
                  <h3 className="arrival-name">{reservation.guest_name}</h3>
                  <span className="arrival-room">Room {reservation.room_number}</span>
                </div>
                <span className={`status-badge status-${reservation.status?.toLowerCase()}`}>
                  {reservation.status || 'PENDING'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
