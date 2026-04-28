import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function MenuMgmtTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    const loadItems = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('category,name')

        if (!error && data) {
          setItems(data)
        }
      } catch (err) {
        console.error('Failed to load menu items:', err)
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [])

  const handleToggleActive = async (itemId, currentStatus) => {
    try {
      await supabase
        .from('menu_items')
        .update({ is_active: !currentStatus })
        .eq('id', itemId)

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_active: !currentStatus } : item
        )
      )
    } catch (err) {
      console.error('Failed to toggle item:', err)
    }
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditData({
      price: item.price,
      description: item.description,
    })
  }

  const handleSaveEdit = async (itemId) => {
    try {
      await supabase
        .from('menu_items')
        .update({
          price: editData.price,
          description: editData.description,
        })
        .eq('id', itemId)

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                price: editData.price,
                description: editData.description,
              }
            : item
        )
      )

      setEditingId(null)
    } catch (err) {
      console.error('Failed to save item:', err)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  if (loading) {
    return <div className="tab-loading">Loading menu items...</div>
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="tab-view menu-mgmt-tab">
      <h2 className="tab-title">Menu Management</h2>

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="menu-category">
          <h3 className="category-title">{category}</h3>
          <div className="menu-items-grid">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`menu-mgmt-card ${!item.is_active ? 'inactive' : ''}`}
              >
                {editingId === item.id ? (
                  <>
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) =>
                        setEditData({ ...editData, price: parseFloat(e.target.value) })
                      }
                      className="edit-input"
                      step="0.01"
                    />
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({ ...editData, description: e.target.value })
                      }
                      className="edit-textarea"
                      maxLength={150}
                    />
                    <div className="edit-buttons">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="item-title">{item.name}</h4>
                    <p className="item-desc">{item.description}</p>
                    <div className="item-meta">
                      <span className="item-price">₹{item.price}</span>
                      {item.is_veg && <span className="veg-tag">🟢 Veg</span>}
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className={`toggle-btn ${!item.is_active ? 'activate' : 'deactivate'}`}
                      >
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
