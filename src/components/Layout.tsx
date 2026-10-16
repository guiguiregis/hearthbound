import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, ready, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-nav">
        <NavLink to="/" className="brand-mark" end>
          <img
            src="/a_parchement_and_a_quill.png"
            alt="Hearthbound logo"
            className="brand-icon"
            width="32"
            height="32"
          />
          Hearthbound
        </NavLink>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          {user ? (
            <>
              <NavLink to="/characters">Roster</NavLink>
              <NavLink to="/create">Create</NavLink>
              <span className="nav-user" title={user.username}>
                {user.displayName || user.username}
              </span>
              <button type="button" className="ghost-btn" onClick={logout}>
                Sign out
              </button>
            </>
          ) : ready ? (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Join</NavLink>
            </>
          ) : null}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
