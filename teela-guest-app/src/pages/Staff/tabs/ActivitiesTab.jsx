import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ActivitiesTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_bookings')
          .select(
            `id,booking_date,time_slot,guest_count,
             reservations(guest_name,room_number),
             activities(name)`
          )
          .gte('booking_date', new Date().toISOString().split('T')[0])
          .order('booking_date,time_slot')

        if (!error && data) {
          setBookings(data)
        }
      } catch (err) {
        console.error('Failed to load bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  if (loading) {
    return <div className="tab-loading">Loading activities...</div>
  }

  return (
    <div className="tab-view activities-tab">
      <h2 className="tab-title">Activity Bookings</h2>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>No upcoming activity bookings</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-info">
                  <h3 className="booking-activity">
                    {booking.activities?.name}
                  </h3>
                  <span className="booking-guest">
                    {booking.reservations?.guest_name} (Room{' '}
                    {booking.reservations?.room_number})
                  </span>
                </div>
              </div>

              <div className="booking-details">
                <span className="detail-item">📅 {booking.booking_date}</span>
                <span className="detail-item">🕐 {booking.time_slot}</span>
                <span className="detail-item">👥 {booking.guest_count} guests</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
