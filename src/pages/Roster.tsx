import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCharacters } from '../context/CharacterContext'
import { createDamakos } from '../lib/presets'
import { searchRoster } from '../lib/search'

export function Roster() {
  const { characters, addCharacter, updateCharacter, deleteCharacter, ready } = useCharacters()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const hits = useMemo(() => searchRoster(characters, query), [characters, query])

  if (!ready) return <p className="empty-state">Loading roster…</p>

  function importDamakos() {
    const fresh = createDamakos()
    const existing = characters.find((c) => c.name === 'Damakos')
    if (existing) {
      const { id: _id, createdAt, ...rest } = fresh
      updateCharacter(existing.id, { ...rest, createdAt: existing.createdAt })
      navigate(`/characters/${existing.id}`)
      return
    }
    addCharacter(fresh)
    navigate(`/characters/${fresh.id}`)
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

      <div className="char-search" style={{ marginBottom: '1.5rem' }}>
        <label className="char-search-label" htmlFor="roster-search">
          Search all characters
        </label>
        <input
          id="roster-search"
          className="char-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find features, gear, notes across your roster…"
        />
      </div>

      {query.trim() && (
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          <h2>Search results</h2>
          {hits.length === 0 ? (
            <p className="meta">No matches for “{query.trim()}”.</p>
          ) : (
            <div className="list-block">
              {hits.slice(0, 20).map((hit) => (
                <button
                  key={`${hit.characterId}-${hit.id}`}
                  type="button"
                  className="list-row"
                  style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => navigate(`/characters/${hit.characterId}`)}
                >
                  <div>
                    <span className="char-search-cat">
                      {hit.characterName} · {hit.category}
                    </span>
                    <strong style={{ display: 'block' }}>{hit.title}</strong>
                    {hit.snippet && <div className="meta">{hit.snippet}</div>}
                  </div>
                  {hit.bonus ? <span className="char-search-bonus">{hit.bonus}</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
