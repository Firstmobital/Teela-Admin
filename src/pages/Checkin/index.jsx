import { useEffect } from 'react'
import { useParams, Outlet, useNavigate } from 'react-router-dom'
import { getToken } from '../../lib/supabaseClient'
import BookingVerify from './BookingVerify'

export default function StayLayout() {
  const navigate = useNavigate()
  const { token } = useParams()

  useEffect(() => {
    // If no token in URL and no token in localStorage, show verify screen
    if (!token) {
      const savedToken = getToken()
      if (savedToken) {
        navigate(`/stay/${savedToken}/home`, { replace: true })
      }
    }
  }, [token, navigate])

  // If no token and no route specified, show booking verify
  if (!token) {
    return <BookingVerify />
  }

  return <Outlet context={{ token }} />
}
