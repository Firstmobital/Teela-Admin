import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { callEdgeFunction, getToken } from '../../lib/supabaseClient'
import PaymentSheet from './PaymentSheet'

export default function BillPage() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [billData, setBillData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    const loadBill = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token) {
          navigate('/stay/verify', { replace: true })
          return
        }

        const data = await callEdgeFunction('folio', { token })
        setBillData(data)
      } catch (err) {
        console.error('Failed to load bill:', err)
        setError('Failed to load bill. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadBill()
  }, [navigate, tokenParam])

  const handleDownloadInvoice = () => {
    window.print()
  }

  const handleClosePayment = () => {
    setShowPayment(false)
  }

  if (loading) {
    return (
      <div className="bill-page">
        <div className="bill-header">
          <h1 className="bill-title">My Bill</h1>
        </div>
        <div className="bill-content">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bill-page">
        <div className="bill-header">
          <h1 className="bill-title">My Bill</h1>
        </div>
        <div className="bill-content">
          <div className="error-banner">{error}</div>
        </div>
      </div>
    )
  }

  if (!billData) {
    return null
  }

  const subtotal = billData.items.reduce((sum, item) => sum + item.amount, 0)
  const cgst = (subtotal * 0.09).toFixed(2)
  const sgst = (subtotal * 0.09).toFixed(2)
  const total = (subtotal + parseFloat(cgst) + parseFloat(sgst)).toFixed(2)

  return (
    <div className="bill-page">
      {/* Header */}
      <div className="bill-header">
        <h1 className="bill-title">My Bill</h1>
      </div>

      {/* Content */}
      <div className="bill-content">
        {/* Bill header info */}
        <div className="bill-info-card">
          <div className="info-row">
            <span className="info-label">Reservation ID</span>
            <span className="info-value">{billData.reservation_id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Guest Name</span>
            <span className="info-value">{billData.guest_name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Room No.</span>
            <span className="info-value">{billData.room_number}</span>
          </div>
        </div>

        {/* Itemized list */}
        <div className="bill-items-section">
          <h2 className="section-title">Charges</h2>
          <div className="bill-items-list">
            {billData.items.map((item, idx) => (
              <div key={idx} className="bill-item">
                <div className="item-details">
                  <span className="item-name">{item.description}</span>
                  {item.quantity && (
                    <span className="item-qty">x {item.quantity}</span>
                  )}
                </div>
                <span className="item-amount">₹{item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subtotal */}
        <div className="bill-subtotal">
          <div className="subtotal-row">
            <span className="subtotal-label">Subtotal</span>
            <span className="subtotal-value">₹{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* GST breakdown */}
        <div className="bill-gst">
          <div className="gst-row">
            <span className="gst-label">CGST (9%)</span>
            <span className="gst-value">₹{cgst}</span>
          </div>
          <div className="gst-row">
            <span className="gst-label">SGST (9%)</span>
            <span className="gst-value">₹{sgst}</span>
          </div>
        </div>

        {/* Total */}
        <div className="bill-total">
          <div className="total-row">
            <span className="total-label">Total Payable</span>
            <span className="total-value">₹{total}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="bill-actions">
          <button onClick={handleDownloadInvoice} className="download-btn">
            📥 Download Invoice
          </button>
          <button onClick={() => setShowPayment(true)} className="pay-btn">
            Checkout & Pay
          </button>
        </div>
      </div>

      {/* Payment Sheet */}
      {showPayment && (
        <PaymentSheet
          amount={parseFloat(total)}
          billData={billData}
          onClose={handleClosePayment}
        />
      )}

      {/* Print stylesheet */}
      <style media="print">{`
        @page {
          size: A4;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        .bill-page {
          background: white;
          color: black;
        }
        
        .bill-header {
          border-bottom: 2px solid #333;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        
        .bill-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .bill-actions {
          display: none !important;
        }
        
        .bill-items-list,
        .bill-item {
          page-break-inside: avoid;
        }
      `}</style>
    </div>
  )
}
