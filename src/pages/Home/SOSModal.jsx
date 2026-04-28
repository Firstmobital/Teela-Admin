import { useEffect } from 'react'

export default function SOSModal({ roomNumber, onClose }) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="sos-modal-overlay" onClick={onClose}>
      <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sos-modal-icon">🚨</div>
        <h2 className="sos-modal-title">SOS sent</h2>
        <p className="sos-modal-message">Help is on the way.</p>
        <div className="sos-modal-room">
          <span className="sos-modal-label">Room</span>
          <span className="sos-modal-value">{roomNumber}</span>
        </div>
        <button onClick={onClose} className="sos-modal-btn">
          OK
        </button>
      </div>
    </div>
  )
}
