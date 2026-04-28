import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, getToken } from '../../lib/supabaseClient'
import ActivityBook from './ActivityBook'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
]

const DURATION_FILTERS = [
  { id: 'under1', label: 'Under 1hr', max: 60 },
  { id: '1to2', label: '1–2hr', min: 60, max: 120 },
  { id: 'halfday', label: 'Half day', min: 120 },
]

export default function ActivityList() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [priceFilter, setPriceFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showBooking, setShowBooking] = useState(false)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token) {
          navigate('/stay/verify', { replace: true })
          return
        }

        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        setActivities(data || [])
      } catch (err) {
        console.error('Failed to load activities:', err)
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
  }, [navigate, tokenParam])

  const filteredActivities = activities.filter((activity) => {
    // Price filter
    if (priceFilter === 'free' && activity.price_per_person !== null) {
      return false
    }
    if (priceFilter === 'paid' && activity.price_per_person === null) {
      return false
    }

    // Duration filter
    if (durationFilter) {
      const filter = DURATION_FILTERS.find((f) => f.id === durationFilter)
      if (filter.max && activity.duration_minutes > filter.max) {
        return false
      }
      if (filter.min && activity.duration_minutes < filter.min) {
        return false
      }
    }

    return true
  })

  const handleBookClick = (activity) => {
    setSelectedActivity(activity)
    setShowBooking(true)
  }

  const handleCloseBooking = () => {
    setShowBooking(false)
    setSelectedActivity(null)
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = minutes / 60
    return hours === Math.floor(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
  }

  const formatPrice = (price) => {
    if (price === null) {
      return 'Complimentary'
    }
    return `₹${price}`
  }

  if (loading) {
    return (
      <div className="activities-page">
        <div className="activities-header">
          <h1 className="activities-title">Activities</h1>
        </div>
        <div className="activities-content">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="activities-page">
      {/* Header */}
      <div className="activities-header">
        <h1 className="activities-title">Activities</h1>
      </div>

      {/* Content */}
      <div className="activities-content">
        {/* Price filter */}
        <div className="filter-section">
          <div className="filter-group">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setPriceFilter(filter.id)}
                className={`filter-chip ${priceFilter === filter.id ? 'filter-chip-active' : ''}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Duration filter */}
          <div className="filter-group">
            {DURATION_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDurationFilter(durationFilter === filter.id ? null : filter.id)}
                className={`filter-chip ${durationFilter === filter.id ? 'filter-chip-active' : ''}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activities list */}
        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <p>No activities found</p>
          </div>
        ) : (
          <div className="activities-list">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="activity-card">
                {/* Image */}
                <div className="activity-image">
                  {activity.image_url ? (
                    <img src={activity.image_url} alt={activity.name} />
                  ) : (
                    <div className="activity-image-placeholder">
                      <span>📸</span>
                    </div>
                  )}
                  {activity.max_capacity && (
                    <div className="capacity-badge">
                      👥 {activity.max_capacity} max
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="activity-info">
                  <h3 className="activity-name">{activity.name}</h3>
                  <p className="activity-description">{activity.description}</p>

                  <div className="activity-meta">
                    <span className="meta-item">⏱ {formatDuration(activity.duration_minutes)}</span>
                    <span className="meta-item price-tag">{formatPrice(activity.price_per_person)}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleBookClick(activity)}
                  className="book-btn"
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBooking && selectedActivity && (
        <ActivityBook
          activity={selectedActivity}
          onClose={handleCloseBooking}
        />
      )}
    </div>
  )
}
