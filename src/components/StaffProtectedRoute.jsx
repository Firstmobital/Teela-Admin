import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession } from '../lib/staffAuth'

export default function StaffProtectedRoute({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session } = await getCurrentSession()
        if (!session) {
          navigate('/staff/login', { replace: true })
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        navigate('/staff/login', { replace: true })
      }
    }

    checkAuth()
  }, [navigate])

  return children
}
