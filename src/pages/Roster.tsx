import { Link, useNavigate } from 'react-router-dom'
import { useCharacters } from '../context/CharacterContext'
import { createDamakos } from '../lib/presets'

export function Roster() {
  const { characters, addCharacter, deleteCharacter, ready } = useCharacters()
  const navigate = useNavigate()

  if (!ready) return <p className="empty-state">Loading roster…</p>

  function importDamakos() {
    const existing = characters.find((c) => c.name === 'Damakos' && c.subclass === 'Soulknife')
    if (existing) {
      navigate(`/characters/${existing.id}`)
      return
    }
    const character = createDamakos()
    addCharacter(character)
    navigate(`/characters/${character.id}`)
  }

  return (
    <section className="section" style={{ marginTop: 0 }}>
      <div className="sheet-header">
        <div>
          <h1 className="section-title">Roster</h1>
          <p className="section-support">Every character saved to this device.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="ghost-btn" onClick={importDamakos}>
            Import Damakos
          </button>
          <Link className="primary-btn" to="/create">
            New character
          </Link>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="panel">
          <p className="empty-state" style={{ padding: 0, margin: 0 }}>
            Your party is empty. Create a character — or import Damakos from your paper sheet.
          </p>
        </div>
      ) : (
        <div className="character-grid">
          {characters.map((c) => (
            <article key={c.id} className="character-tile" style={{ cursor: 'default' }}>
              <h3>{c.name}</h3>
              <p className="meta">
                Level {c.level} {c.race} {c.className}
                {c.subclass ? ` (${c.subclass})` : ''}
              </p>
              <p className="meta" style={{ marginTop: '0.35rem' }}>
                HP {c.hp.current}/{c.hp.max}
                {c.hp.temp > 0 ? ` (+${c.hp.temp} temp)` : ''}
              </p>
              <div className="actions-row" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link className="ghost-btn" to={`/characters/${c.id}`}>
                    Sheet
                  </Link>
                  <Link className="primary-btn" to={`/characters/${c.id}/session`}>
                    Session
                  </Link>
                </div>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    if (confirm(`Delete ${c.name}?`)) deleteCharacter(c.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
