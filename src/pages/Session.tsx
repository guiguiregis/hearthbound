import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { RollAssistant } from '../components/RollAssistant'
import { CONDITIONS } from '../data/dnd'
import { useCharacters } from '../context/CharacterContext'
import type { RollBreakdown } from '../lib/dice'
import { uid } from '../lib/storage'
import { formatModifier, hpPercent } from '../lib/stats'
import type { Condition, SessionNote } from '../types/character'

export function Session() {
  const { id = '' } = useParams()
  const { getCharacter, updateCharacter, ready } = useCharacters()
  const character = getCharacter(id)
  const [damageInput, setDamageInput] = useState('1')
  const [healInput, setHealInput] = useState('1')
  const [conditionPick, setConditionPick] = useState<Condition>('Poisoned')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')

  const percent = useMemo(() => (character ? hpPercent(character) : 0), [character])

  if (!ready) return <p className="empty-state">Loading session…</p>
  if (!character) return <Navigate to="/characters" replace />

  function patch(partial: Parameters<typeof updateCharacter>[1]) {
    updateCharacter(character!.id, partial)
  }

  function appendLog(title: string, body: string) {
    const note: SessionNote = {
      id: uid(),
      title,
      body,
      createdAt: new Date().toISOString(),
    }
    patch({ sessionLog: [note, ...(character!.sessionLog ?? [])] })
  }

  function adjustHp(delta: number) {
    let temp = character!.hp.temp
    let current = character!.hp.current
    if (delta < 0) {
      let dmg = Math.abs(delta)
      const absorbed = Math.min(temp, dmg)
      temp -= absorbed
      dmg -= absorbed
      current = Math.max(0, current - dmg)
    } else {
      current = Math.min(character!.hp.max, current + delta)
    }
    patch({ hp: { ...character!.hp, current, temp } })
  }

  function setDeathPips(kind: 'successes' | 'failures', count: number) {
    const current = character!.deathSaves[kind]
    const next = current === count ? count - 1 : count
    patch({
      deathSaves: {
        ...character!.deathSaves,
        [kind]: Math.max(0, Math.min(3, next)),
      },
    })
  }

  function shortRest() {
    const note: SessionNote = {
      id: uid(),
      title: 'Short rest',
      body: `Took a short rest at ${new Date().toLocaleTimeString()}.`,
      createdAt: new Date().toISOString(),
    }
    patch({
      hp: {
        ...character!.hp,
        current: Math.min(
          character!.hp.max,
          character!.hp.current + Math.max(1, Math.floor(character!.hp.max * 0.25)),
        ),
      },
      sessionLog: [note, ...(character!.sessionLog ?? [])],
    })
  }

  function longRest() {
    const note: SessionNote = {
      id: uid(),
      title: 'Long rest',
      body: `Took a long rest at ${new Date().toLocaleTimeString()}. Feature uses reset.`,
      createdAt: new Date().toISOString(),
    }
    const resetFeatures = (character!.features ?? []).map((f) =>
      f.uses && f.uses.total > 0 ? { ...f, uses: { ...f.uses, used: 0 } } : f,
    )
    patch({
      hp: { current: character!.hp.max, max: character!.hp.max, temp: 0 },
      deathSaves: { successes: 0, failures: 0 },
      conditions: character!.conditions.filter((c) => c === 'Exhaustion'),
      features: resetFeatures,
      sessionLog: [note, ...(character!.sessionLog ?? [])],
    })
  }

  function addSessionNote() {
    if (!noteTitle.trim() && !noteBody.trim()) return
    appendLog(noteTitle.trim() || 'Session note', noteBody.trim())
    setNoteTitle('')
    setNoteBody('')
  }

  function logRoll(breakdown: RollBreakdown) {
    appendLog('Dice roll', breakdown.summary)
  }

  return (
    <section className="section" style={{ marginTop: 0 }}>
      <div className="sheet-header">
        <div>
          <h1>{character.name}</h1>
          <p className="meta">
            Session Mode · Level {character.level} {character.className} · AC {character.armorClass} ·
            Init {formatModifier(character.initiative)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link className="ghost-btn" to={`/characters/${character.id}`}>
            Full sheet
          </Link>
          <Link className="ghost-btn" to="/characters">
            Roster
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <RollAssistant character={character} onLog={logRoll} />
      </div>

      <div className="session-grid">
        <div className="panel">
          <h2>Hit points</h2>
          <div className="hp-display">
            {character.hp.current}
            <span className="meta" style={{ fontSize: '1.1rem' }}>
              {' '}
              / {character.hp.max}
            </span>
          </div>
          {character.hp.temp > 0 && <p className="meta">Temporary HP: +{character.hp.temp}</p>}
          <div className="hp-meter" aria-hidden="true">
            <i style={{ width: `${percent}%` }} />
          </div>

          <div className="hp-controls">
            <button type="button" className="icon-btn" onClick={() => adjustHp(-1)} aria-label="Damage 1">
              −
            </button>
            <button type="button" className="icon-btn" onClick={() => adjustHp(1)} aria-label="Heal 1">
              +
            </button>
            <div className="inline-form" style={{ marginTop: 0, flex: 1 }}>
              <input
                type="number"
                min={1}
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                aria-label="Damage amount"
              />
              <button
                type="button"
                className="danger-btn"
                onClick={() => adjustHp(-Math.max(1, Number(damageInput) || 1))}
              >
                Damage
              </button>
              <input
                type="number"
                min={1}
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                aria-label="Heal amount"
              />
              <button
                type="button"
                className="primary-btn"
                onClick={() => adjustHp(Math.max(1, Number(healInput) || 1))}
              >
                Heal
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Temp HP
              <input
                type="number"
                min={0}
                value={character.hp.temp}
                onChange={(e) =>
                  patch({
                    hp: {
                      ...character.hp,
                      temp: Math.max(0, Number(e.target.value) || 0),
                    },
                  })
                }
              />
            </label>
            <label>
              Inspiration
              <button
                type="button"
                className={character.inspiration ? 'primary-btn' : 'ghost-btn'}
                onClick={() => patch({ inspiration: !character.inspiration })}
              >
                {character.inspiration ? 'Inspired' : 'Not inspired'}
              </button>
            </label>
          </div>

          <div className="actions-row">
            <button type="button" className="ghost-btn" onClick={shortRest}>
              Short rest
            </button>
            <button type="button" className="primary-btn" onClick={longRest}>
              Long rest
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Conditions</h2>
          <div className="condition-wrap" style={{ marginBottom: '1rem' }}>
            {character.conditions.length === 0 && (
              <span className="meta">Clear — no conditions.</span>
            )}
            {character.conditions.map((c) => (
              <span key={c} className="condition-chip">
                {c}
                <button
                  type="button"
                  aria-label={`Remove ${c}`}
                  onClick={() =>
                    patch({
                      conditions: character.conditions.filter((x) => x !== c),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="inline-form">
            <select
              value={conditionPick}
              onChange={(e) => setConditionPick(e.target.value as Condition)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                if (character.conditions.includes(conditionPick)) return
                patch({ conditions: [...character.conditions, conditionPick] })
              }}
            >
              Add
            </button>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Death saves</h3>
          <div className="death-saves">
            <div>
              <span className="meta">Successes</span>
              <div className="pip-row">
                {[1, 2, 3].map((n) => (
                  <button
                    key={`s${n}`}
                    type="button"
                    className={`pip success ${character.deathSaves.successes >= n ? 'on' : ''}`}
                    onClick={() => setDeathPips('successes', n)}
                    aria-label={`Success ${n}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <span className="meta">Failures</span>
              <div className="pip-row">
                {[1, 2, 3].map((n) => (
                  <button
                    key={`f${n}`}
                    type="button"
                    className={`pip fail ${character.deathSaves.failures >= n ? 'on' : ''}`}
                    onClick={() => setDeathPips('failures', n)}
                    aria-label={`Failure ${n}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="ghost-btn"
            style={{ marginTop: '0.85rem' }}
            onClick={() => patch({ deathSaves: { successes: 0, failures: 0 } })}
          >
            Reset death saves
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h2>Session notes</h2>
        <div className="form-grid">
          <label>
            Title
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Clue / combat / NPC"
            />
          </label>
          <label className="full">
            Note
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Track clues, loot promises, and what the party still owes the innkeeper…"
              style={{ minHeight: 100 }}
            />
          </label>
        </div>
        <div className="actions-row">
          <span />
          <button type="button" className="primary-btn" onClick={addSessionNote}>
            Add note
          </button>
        </div>
        <div className="list-block" style={{ marginTop: '1rem' }}>
          {(character.sessionLog ?? []).length === 0 && (
            <p className="meta">No notes yet — add one above.</p>
          )}
          {(character.sessionLog ?? []).map((note) => (
            <div key={note.id} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <strong>{note.title}</strong>
                <div className="meta">{new Date(note.createdAt).toLocaleString()}</div>
                {note.body && <p style={{ margin: '0.35rem 0 0' }}>{note.body}</p>}
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() =>
                  patch({
                    sessionLog: (character.sessionLog ?? []).filter((n) => n.id !== note.id),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <label style={{ marginTop: '1rem' }}>
          Scratch pad
          <textarea
            value={character.sessionNotes}
            onChange={(e) => patch({ sessionNotes: e.target.value })}
            placeholder="Freeform overflow…"
            style={{ minHeight: 80 }}
          />
        </label>
      </div>
    </section>
  )
}
