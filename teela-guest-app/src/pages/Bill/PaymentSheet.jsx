import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getToken, callEdgeFunction } from '../../lib/supabaseClient'

export default function PaymentSheet({ amount, billData, onClose }) {
  const { token: tokenParam } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentState, setPaymentState] = useState('ready') // ready, processing, success, failed
  const [transactionId, setTransactionId] = useState('')

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      const token = tokenParam || getToken()
      if (!token) throw new Error('No token')

      // Get guest info from billData
      const guestName = billData.guest_name
      const guestMobile = billData.mobile || '9876543210'

      // Step 1: Create Razorpay order
      setPaymentState('processing')
      const orderResponse = await callEdgeFunction('payment', {
        token,
        amount: Math.round(amount * 100), // Convert to paise
      })

      const { razorpay_order_id } = orderResponse
      if (!razorpay_order_id) throw new Error('Failed to create order')

      // Step 2: Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        order_id: razorpay_order_id,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Teela',
        description: 'Hotel Bill Payment',
        prefill: {
          name: guestName,
          contact: guestMobile,
        },
        handler: async (response) => {
          // Step 3: Verify payment
          try {
            await callEdgeFunction('payment/verify', {
              token,
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
            })

            setTransactionId(response.razorpay_payment_id)
            setPaymentState('success')

            // Redirect after 3 seconds
            setTimeout(() => {
              navigate(`/stay/${token}/checkout-confirm`, {
                state: {
                  transactionId: response.razorpay_payment_id,
                  amount,
                },
              })
            }, 3000)
          } catch (verifyErr) {
            setError('Payment verification failed. Please contact support.')
            setPaymentState('failed')
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentState('ready')
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment initiation failed. Please try again.')
      setPaymentState('failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-sheet-header">
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
          <h2 className="payment-sheet-title">Payment</h2>
          <div style={{ width: '40px' }} />
        </div>

        {/* Content */}
        <div className="payment-sheet-content">
          {paymentState === 'success' ? (
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h3 className="success-title">Payment successful!</h3>
              <p className="success-message">
                Thank you for staying at Teela.
              </p>
              <div className="transaction-id">
                <span className="trans-label">Transaction ID</span>
                <span className="trans-value">{transactionId}</span>
              </div>
            </div>
          ) : paymentState === 'failed' ? (
            <div className="error-container">
              <div className="error-icon">✕</div>
              <h3 className="error-title">Payment failed</h3>
              <p className="error-message">Please try again.</p>
              {error && <p className="error-detail">{error}</p>}
              <button
                onClick={() => setPaymentState('ready')}
                className="retry-btn"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Amount display */}
              <div className="payment-amount-section">
                <span className="amount-label">Total Amount</span>
                <span className="amount-value">₹{amount.toFixed(2)}</span>
              </div>

              {error && <div className="error-banner">{error}</div>}

              {/* Payment button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="razorpay-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Initiating...
                  </>
                ) : (
                  `Pay ₹${amount.toFixed(2)} with Razorpay`
                )}
              </button>

              <p className="payment-note">
                You will be redirected to Razorpay to complete the payment.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
