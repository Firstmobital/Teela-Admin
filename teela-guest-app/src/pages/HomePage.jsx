import { useGuestSession } from '../hooks/useGuestSession'

export default function HomePage() {
  const { data: session, isLoading } = useGuestSession()

  return (
    <section>
      <h2>Welcome to the Teela guest experience</h2>
      <p>Book activities, order services, and manage your stay in one app.</p>
      <p>
        Session status:{' '}
        {isLoading ? 'Checking session...' : session ? 'Signed in' : 'Guest mode'}
      </p>
    </section>
  )
}
