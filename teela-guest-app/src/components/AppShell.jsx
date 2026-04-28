import { Link, Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Teela guest app</h1>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
