import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase, getToken } from '../../lib/supabaseClient'

export default function CheckoutConfirm() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const location = useLocation()
  const [guestInfo, setGuestInfo] = useState(null)
  const transactionId = location.state?.transactionId
  const amount = location.state?.amount

  useEffect(() => {
    const loadGuestInfo = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token || !transactionId) {
          navigate(`/stay/${token || ''}/bill`, { replace: true })
          return
        }

        const { data } = await supabase
          .from('reservations')
          .select('guest_name,checkin_date,checkout_date')
          .eq('unique_token', token)
          .single()

        if (data) {
          setGuestInfo(data)
        }
      } catch (err) {
        console.error('Failed to load guest info:', err)
      }
    }

    loadGuestInfo()
  }, [navigate, tokenParam, transactionId])

  const calculateNights = () => {
    if (!guestInfo) return 0
    const checkin = new Date(guestInfo.checkin_date)
    const checkout = new Date(guestInfo.checkout_date)
    return Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="checkout-confirm-page">
      <div className="confirm-content">
        <div className="confirm-icon">✓</div>

        <h1 className="confirm-title">
          Safe travels, {guestInfo?.guest_name}
        </h1>

        {/* Summary card */}
        <div className="confirm-summary">
          <div className="summary-item">
            <span className="summary-label">Nights Stayed</span>
            <span className="summary-value">{calculateNights()}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-label">Total Paid</span>
            <span className="summary-value">₹{amount?.toFixed(2)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-label">Transaction ID</span>
            <span className="summary-value summary-trans">{transactionId?.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Message */}
        <p className="confirm-message">
          We hope to see you again at Teela.
        </p>

        {/* Action button */}
        <button
          onClick={() => navigate('/stay/verify', { replace: true })}
          className="confirm-btn"
        >
          Back to Check-in
        </button>
      </div>
    </div>
  )
}
