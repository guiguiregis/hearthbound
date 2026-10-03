import { NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-nav">
        <NavLink to="/" className="brand-mark" end>
          <span className="brand-flame" aria-hidden="true" />
          Hearthbound
        </NavLink>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/characters">Roster</NavLink>
          <NavLink to="/create">Create</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
