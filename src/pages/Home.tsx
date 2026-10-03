import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCharacters } from '../context/CharacterContext'

export function Home() {
  const { user, ready } = useAuth()
  const { characters } = useCharacters()

  return (
    <>
      <section className="hero" aria-label="Hearthbound hero">
        <div className="hero-visual" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-brand">Hearthbound</p>
          <h1 className="hero-headline">Your living D&amp;D character ledger</h1>
          <p className="hero-support">
            Every player gets their own account and sheets — forge a hero, keep it current, and
            update mid-session without breaking the table flow.
          </p>
          <div className="cta-row">
            {user ? (
              <>
                <Link className="primary-btn" to="/create">
                  Create a character
                </Link>
                <Link className="ghost-btn" to="/characters">
                  Open roster
                </Link>
              </>
            ) : (
              <>
                <Link className="primary-btn" to="/register">
                  Create an account
                </Link>
                <Link className="ghost-btn" to="/login">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">At the table</h2>
        <p className="section-support">
          {user
            ? 'Build once, then jump into Session Mode when initiative is called.'
            : 'Sign in to see your roster. Friends can each create their own sheets.'}
        </p>
        {!ready ? (
          <p className="empty-state">Loading…</p>
        ) : !user ? (
          <p className="empty-state">No account yet — join to start your first character.</p>
        ) : characters.length === 0 ? (
          <p className="empty-state">No characters yet — start with Create when you&apos;re ready.</p>
        ) : (
          <div className="character-grid">
            {characters.slice(0, 3).map((c) => (
              <Link key={c.id} className="character-tile" to={`/characters/${c.id}`}>
                <h3>{c.name}</h3>
                <p className="meta">
                  Level {c.level} {c.race} {c.className}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
