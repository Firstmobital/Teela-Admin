import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken } from '../lib/supabaseClient'

/**
 * ProtectedRoute wrapper - ensures token is available before rendering.
 * If no token, redirects to /checkin.
 */
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/checkin', { replace: true })
    }
  }, [navigate])

  const token = getToken()
  if (!token) {
    return null
  }

  return children
}
