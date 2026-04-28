import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('food_orders')
          .select(
            `id,reservation_id,status,created_at,
             reservations(room_number),
             food_order_items(quantity,menu_items(name,price))`
          )
          .in('status', ['PENDING', 'CONFIRMED'])
          .order('created_at', { ascending: false })

        if (!error && data) {
          setOrders(data)
        }
      } catch (err) {
        console.error('Failed to load orders:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('food_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_orders',
        },
        () => {
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleMarkReady = async (orderId) => {
    try {
      await supabase
        .from('food_orders')
        .update({ status: 'READY' })
        .eq('id', orderId)

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'READY' } : order
        )
      )
    } catch (err) {
      console.error('Failed to update order:', err)
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="tab-loading">Loading orders...</div>
  }

  return (
    <div className="tab-view orders-tab">
      <h2 className="tab-title">Food Orders</h2>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No pending orders</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-room">
                  Room {order.reservations?.room_number}
                </span>
                <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-items">
                {order.food_order_items?.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <span className="item-name">
                      {item.menu_items?.name} x {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span className="order-time">
                  {formatTime(order.created_at)}
                </span>
                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleMarkReady(order.id)}
                    className="ready-btn"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
