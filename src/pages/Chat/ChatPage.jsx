import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, getToken } from '../../lib/supabaseClient'

const QUICK_ACTIONS = [
  { id: 'reception', label: 'Call Reception' },
  { id: 'housekeeping', label: 'Housekeeping' },
  { id: 'room_service', label: 'Room Service' },
]

export default function ChatPage() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [guestName, setGuestName] = useState('')
  const [reservationId, setReservationId] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const subscriptionRef = useRef(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load initial data
  useEffect(() => {
    const initChat = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token) {
          navigate('/stay/verify', { replace: true })
          return
        }

        // Load reservation
        const { data: reservation, error: resError } = await supabase
          .from('reservations')
          .select('id,guest_name')
          .eq('unique_token', token)
          .single()

        if (resError || !reservation) {
          navigate('/stay/verify', { replace: true })
          return
        }

        setReservationId(reservation.id)
        setGuestName(reservation.guest_name)

        // Load initial messages
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('reservation_id', reservation.id)
          .order('created_at', { ascending: true })

        if (!msgError && msgs) {
          setMessages(msgs)
        }

        setLoading(false)

        // Subscribe to real-time updates
        const channel = supabase
          .channel(`reservation_${reservation.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `reservation_id=eq.${reservation.id}`,
            },
            (payload) => {
              // Only add if not already in messages (avoid duplicates from optimistic add)
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === payload.new.id)
                if (exists) return prev
                return [...prev, payload.new]
              })
            }
          )
          .subscribe()

        subscriptionRef.current = channel

        // Fallback polling every 10 seconds
        const lastMessageTime = new Date().toISOString()
        pollIntervalRef.current = setInterval(async () => {
          const { data: newMsgs } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('reservation_id', reservation.id)
            .gt('created_at', lastMessageTime)
            .order('created_at', { ascending: true })

          if (newMsgs && newMsgs.length > 0) {
            setMessages((prev) => {
              const newMessages = newMsgs.filter(
                (m) => !prev.some((existing) => existing.id === m.id)
              )
              return [...prev, ...newMessages]
            })
          }
        }, 10000)
      } catch (err) {
        console.error('Failed to initialize chat:', err)
      }
    }

    initChat()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [navigate, tokenParam])

  // Online status detection
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSendMessage = async (text) => {
    if (!text.trim() || !online || !reservationId) return

    setSending(true)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      reservation_id: reservationId,
      sender_type: 'GUEST',
      sender_name: guestName,
      message: text,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage])
    setInputText('')

    try {
      const { error } = await supabase.from('chat_messages').insert({
        reservation_id: reservationId,
        sender_type: 'GUEST',
        sender_name: guestName,
        message: text,
      })

      if (error) {
        // Remove temp message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempMessage.id)
        )
        setInputText(text) // Restore input
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setInputText(text)
    } finally {
      setSending(false)
    }
  }

  const handleQuickAction = (action) => {
    handleSendMessage(action.label)
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-header">
          <h1 className="chat-title">Chat with Teela Staff</h1>
        </div>
        <div className="chat-content">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <h1 className="chat-title">Chat with Teela Staff</h1>
          <a href="tel:+919876543210" className="phone-icon" title="Call front desk">
            📞
          </a>
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="quick-action-btn"
              disabled={!online}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offline banner */}
      {!online && (
        <div className="offline-banner">
          ⚠ You are offline. Chat unavailable.
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Send a message or tap a quick action.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.sender_type === 'GUEST' ? 'message-guest' : 'message-staff'
              }`}
            >
              {msg.sender_type === 'STAFF' && (
                <div className="staff-label">Teela Staff</div>
              )}
              <div className="message-bubble">
                <p className="message-text">{msg.message}</p>
                <span className="message-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !sending) {
                handleSendMessage(inputText)
              }
            }}
            placeholder="Type a message..."
            disabled={!online || sending}
            className="chat-input"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || !online || sending}
            className="send-btn"
          >
            {sending ? '⏳' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
