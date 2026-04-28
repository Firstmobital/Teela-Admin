import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function PreferencesTab() {
  const [preferences, setPreferences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(
            `id,room_number,guest_name,
             pillow_preference,wakeup_time,dietary_tags,special_requests`
          )
          .not('special_requests', 'is', null)
          .order('room_number')

        if (!error && data) {
          setPreferences(data)
        }
      } catch (err) {
        console.error('Failed to load preferences:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  if (loading) {
    return <div className="tab-loading">Loading preferences...</div>
  }

  return (
    <div className="tab-view preferences-tab">
      <h2 className="tab-title">Guest Preferences</h2>

      {preferences.length === 0 ? (
        <div className="empty-state">
          <p>No guest preferences submitted</p>
        </div>
      ) : (
        <div className="preferences-list">
          {preferences.map((pref) => (
            <div key={pref.id} className="preference-card">
              <div className="pref-header">
                <h3 className="pref-room">Room {pref.room_number}</h3>
                <span className="pref-guest">{pref.guest_name}</span>
              </div>

              <div className="pref-details">
                {pref.pillow_preference && (
                  <div className="pref-item">
                    <span className="pref-label">Pillow:</span>
                    <span className="pref-value">{pref.pillow_preference}</span>
                  </div>
                )}
                {pref.wakeup_time && (
                  <div className="pref-item">
                    <span className="pref-label">Wake-up:</span>
                    <span className="pref-value">{pref.wakeup_time}</span>
                  </div>
                )}
                {pref.dietary_tags && pref.dietary_tags.length > 0 && (
                  <div className="pref-item">
                    <span className="pref-label">Dietary:</span>
                    <span className="pref-value">{pref.dietary_tags.join(', ')}</span>
                  </div>
                )}
                {pref.special_requests && (
                  <div className="pref-item full-width">
                    <span className="pref-label">Special requests:</span>
                    <span className="pref-value">{pref.special_requests}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
