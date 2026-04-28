import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, getToken } from '../../lib/supabaseClient'
import Cart from './Cart'

const CATEGORIES = [
  { id: 'soups', label: 'Soups & Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'breads', label: 'Breads & Rice' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'beverages', label: 'Beverages' },
]

const CATEGORY_MAP = {
  'Soups & Starters': 'soups',
  'Mains': 'mains',
  'Breads & Rice': 'breads',
  'Desserts': 'desserts',
  'Beverages': 'beverages',
}

export default function MenuPage() {
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('soups')
  const [cart, setCart] = useState({})
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const token = tokenParam || getToken()
        if (!token) {
          navigate('/stay/verify', { replace: true })
          return
        }

        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_active', true)
          .order('category,name')

        if (error) throw error
        setMenuItems(data || [])
      } catch (err) {
        console.error('Failed to load menu items:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMenuItems()
  }, [navigate, tokenParam])

  // Group items by category
  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = menuItems.filter(
      (item) => CATEGORY_MAP[item.category] === cat.id
    )
    return acc
  }, {})

  const currentCategoryItems = groupedItems[activeCategory] || []

  // Cart calculations
  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const cartTotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find((m) => m.id === itemId)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  const handleAddItem = (itemId) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }))
  }

  const handleRemoveItem = (itemId) => {
    setCart((prev) => {
      if (prev[itemId] <= 1) {
        const newCart = { ...prev }
        delete newCart[itemId]
        return newCart
      }
      return {
        ...prev,
        [itemId]: prev[itemId] - 1,
      }
    })
  }

  const handleCloseCart = () => {
    setShowCart(false)
  }

  const handleCartCleared = () => {
    setCart({})
    setShowCart(false)
  }

  if (loading) {
    return (
      <div className="menu-page">
        <div className="menu-header">
          <h1 className="menu-title">Order Food</h1>
        </div>
        <div className="menu-content">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-page">
      {/* Header */}
      <div className="menu-header">
        <h1 className="menu-title">Order Food</h1>
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`category-tab ${activeCategory === cat.id ? 'category-tab-active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu content */}
      <div className="menu-content">
        {currentCategoryItems.length === 0 ? (
          <div className="empty-state">
            <p>No items in this category</p>
          </div>
        ) : (
          <div className="menu-items-list">
            {currentCategoryItems.map((item) => (
              <div key={item.id} className="menu-item-card">
                <div className="item-header">
                  <div className="item-name-section">
                    <h3 className="item-name">{item.name}</h3>
                    {item.is_veg && (
                      <span className="veg-indicator" title="Vegetarian">
                        🟢
                      </span>
                    )}
                  </div>
                  <span className="item-price">₹{item.price}</span>
                </div>

                <p className="item-description">{item.description}</p>

                <div className="item-footer">
                  <div className="quantity-control">
                    {cart[item.id] ? (
                      <div className="quantity-stepper">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="qty-btn"
                        >
                          −
                        </button>
                        <span className="qty-display">{cart[item.id]}</span>
                        <button
                          onClick={() => handleAddItem(item.id)}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddItem(item.id)}
                        className="add-btn"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {cartItemCount > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-info">
            <span className="cart-item-count">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
            <span className="cart-divider">•</span>
            <span className="cart-total">₹{cartTotal}</span>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="cart-bar-btn"
          >
            View Order
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <Cart
          items={cart}
          menuItems={menuItems}
          onClose={handleCloseCart}
          onCleared={handleCartCleared}
        />
      )}
    </div>
  )
}
