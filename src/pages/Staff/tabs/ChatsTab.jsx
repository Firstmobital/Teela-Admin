import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ChatsTab() {
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('id,guest_name,room_number')
          .order('room_number')

        if (!error && data) {
          setThreads(data)
        }
      } catch (err) {
        console.error('Failed to load threads:', err)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [])

  const handleSelectThread = async (thread) => {
    setSelectedThread(thread)
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('reservation_id', thread.id)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedThread) return

    setSending(true)
    try {
      const { error } = await supabase.from('chat_messages').insert({
        reservation_id: selectedThread.id,
        sender_type: 'STAFF',
        sender_name: 'Teela Staff',
        message: inputText,
      })

      if (!error) {
        setInputText('')
        // Reload messages
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('reservation_id', selectedThread.id)
          .order('created_at', { ascending: true })

        if (data) {
          setMessages(data)
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="tab-loading">Loading chats...</div>
  }

  return (
    <div className="tab-view chats-tab">
      <div className="chats-container">
        {/* Thread list */}
        <div className="chats-sidebar">
          <h3 className="chats-title">Conversations</h3>
          <div className="chats-list">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread)}
                className={`chat-thread ${
                  selectedThread?.id === thread.id ? 'chat-thread-active' : ''
                }`}
              >
                <span className="thread-room">Room {thread.room_number}</span>
                <span className="thread-name">{thread.guest_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat view */}
        {selectedThread ? (
          <div className="chat-view">
            <div className="chat-header">
              <h3>{selectedThread.guest_name}</h3>
              <span>Room {selectedThread.room_number}</span>
            </div>

            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${
                    msg.sender_type === 'STAFF'
                      ? 'message-staff'
                      : 'message-guest'
                  }`}
                >
                  <div className="message-bubble">
                    <p className="message-text">{msg.message}</p>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !sending) {
                    handleSendMessage()
                  }
                }}
                placeholder="Type a message..."
                disabled={sending}
                className="chat-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || sending}
                className="send-btn"
              >
                →
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
