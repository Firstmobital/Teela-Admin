import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getToken, callEdgeFunction } from '../../lib/supabaseClient'

export default function Cart({ items, menuItems, onClose, onCleared }) {
  const { token: tokenParam } = useParams()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const cartItems = Object.entries(items)
    .map(([itemId, qty]) => ({
      itemId,
      qty,
      item: menuItems.find((m) => m.id === itemId),
    }))
    .filter((item) => item.item)

  const total = cartItems.reduce((sum, { item, qty }) => sum + item.price * qty, 0)

  const handlePlaceOrder = async () => {
    setLoading(true)
    setError('')

    try {
      const token = tokenParam || getToken()
      if (!token) throw new Error('No token')

      await callEdgeFunction('order', {
        token,
        items: cartItems.map(({ item, qty }) => ({
          menu_item_id: item.id,
          quantity: qty,
        })),
        special_instructions: notes || null,
      })

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-sheet-header">
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
          <h2 className="cart-sheet-title">Order Details</h2>
          <div style={{ width: '40px' }} />
        </div>

        {success ? (
          <div className="cart-sheet-content success-state">
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h3 className="success-title">Order placed!</h3>
              <p className="success-message">
                Your food is being prepared.
              </p>
              <button
                onClick={() => {
                  onCleared()
                }}
                className="success-btn"
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-sheet-content">
            {/* Cart items */}
            <div className="cart-items-section">
              <h3 className="section-title">Items</h3>
              <div className="cart-items-list">
                {cartItems.map(({ itemId, item, qty }) => (
                  <div key={itemId} className="cart-item">
                    <div className="cart-item-details">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-qty">x {qty}</span>
                    </div>
                    <span className="cart-item-price">₹{item.price * qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="notes-section">
              <label className="section-title">Order notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions? (e.g. less spicy)"
                maxLength={300}
                rows={3}
                className="notes-input"
                disabled={loading}
              />
              <span className="notes-hint">{notes.length} / 300</span>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Total */}
            <div className="cart-total-section">
              <div className="total-row">
                <span className="total-label">Total</span>
                <span className="total-value">₹{total}</span>
              </div>
            </div>

            {/* Place Order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="place-order-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Placing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
