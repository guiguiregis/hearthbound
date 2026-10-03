import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CharacterSearch } from '../components/CharacterSearch'
import { ABILITY_LABELS, ABILITY_SHORT, SKILLS } from '../data/dnd'
import { useCharacters } from '../context/CharacterContext'
import type { SearchHit } from '../lib/search'
import { uid } from '../lib/storage'
import {
  abilityModifier,
  formatModifier,
  hpPercent,
  proficiencyBonusForLevel,
  savingThrowModifier,
  skillModifier,
} from '../lib/stats'
import type { AbilityKey, Attack, Feature, InventoryItem, SessionNote, SpellEntry } from '../types/character'

type Tab = 'combat' | 'skills' | 'features' | 'gear' | 'magic' | 'story'

const emptyFeatureForm = {
  name: '',
  className: '',
  level: '',
  action: '',
  save: '',
  range: '',
  duration: '',
  value: '',
  recovers: '',
  usesTotal: '0',
  description: '',
}

export function Sheet() {
  const { id = '' } = useParams()
  const { getCharacter, updateCharacter, ready } = useCharacters()
  const character = getCharacter(id)
  const [tab, setTab] = useState<Tab>('combat')
  const [itemName, setItemName] = useState('')
  const [featureForm, setFeatureForm] = useState(emptyFeatureForm)
  const [spellName, setSpellName] = useState('')
  const [spellLevel, setSpellLevel] = useState(0)
  const [attackName, setAttackName] = useState('')
  const [attackBonus, setAttackBonus] = useState('+0')
  const [attackDamage, setAttackDamage] = useState('1d6')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const percent = useMemo(() => (character ? hpPercent(character) : 0), [character])

  if (!ready) return <p className="empty-state">Loading sheet…</p>
  if (!character) return <Navigate to="/characters" replace />

  function patch(partial: Parameters<typeof updateCharacter>[1]) {
    updateCharacter(character!.id, partial)
  }

  function handleSearchSelect(hit: SearchHit) {
    setTab(hit.tab)
    setHighlightId(hit.id)
    window.setTimeout(() => {
      const el = document.getElementById(`search-${hit.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    window.setTimeout(() => setHighlightId((current) => (current === hit.id ? null : current)), 2200)
  }

  function setAbility(key: AbilityKey, value: number) {
    const abilities = { ...character!.abilities, [key]: Math.min(30, Math.max(1, value)) }
    patch({
      abilities,
      proficiencyBonus: proficiencyBonusForLevel(character!.level),
      initiative: abilityModifier(abilities.dex),
    })
  }

  function addItem() {
    if (!itemName.trim()) return
    const item: InventoryItem = { id: uid(), name: itemName.trim(), qty: 1 }
    patch({ inventory: [...character!.inventory, item] })
    setItemName('')
  }

  function addFeature() {
    if (!featureForm.name.trim()) return
    const total = Math.max(0, Number(featureForm.usesTotal) || 0)
    const feature: Feature = {
      id: uid(),
      name: featureForm.name.trim(),
      description: featureForm.description.trim(),
      className: featureForm.className.trim(),
      level: featureForm.level === '' ? null : Number(featureForm.level) || null,
      action: featureForm.action.trim(),
      save: featureForm.save.trim(),
      range: featureForm.range.trim(),
      duration: featureForm.duration.trim(),
      value: featureForm.value.trim(),
      recovers: featureForm.recovers.trim(),
      uses: { used: 0, total },
    }
    patch({ features: [...character!.features, feature] })
    setFeatureForm(emptyFeatureForm)
  }

  function updateFeature(id: string, next: Partial<Feature>) {
    patch({
      features: character!.features.map((f) => (f.id === id ? { ...f, ...next } : f)),
    })
  }

  function bumpFeatureUse(id: string, delta: number) {
    const f = character!.features.find((x) => x.id === id)
    if (!f) return
    const uses = f.uses ?? { used: 0, total: 0 }
    const used = Math.max(0, Math.min(uses.total || 99, uses.used + delta))
    updateFeature(id, { uses: { ...uses, used } })
  }

  function addSpell() {
    if (!spellName.trim()) return
    const spell: SpellEntry = {
      id: uid(),
      name: spellName.trim(),
      level: spellLevel,
      prepared: true,
    }
    patch({ spells: [...character!.spells, spell] })
    setSpellName('')
  }

  function addAttack() {
    if (!attackName.trim()) return
    const attack: Attack = {
      id: uid(),
      name: attackName.trim(),
      bonus: attackBonus.trim() || '+0',
      damage: attackDamage.trim() || '1d6',
    }
    patch({ attacks: [...(character!.attacks ?? []), attack] })
    setAttackName('')
    setAttackBonus('+0')
    setAttackDamage('1d6')
  }

  function addSessionNote() {
    if (!noteTitle.trim() && !noteBody.trim()) return
    const note: SessionNote = {
      id: uid(),
      title: noteTitle.trim() || 'Session note',
      body: noteBody.trim(),
      createdAt: new Date().toISOString(),
    }
    patch({ sessionLog: [note, ...(character!.sessionLog ?? [])] })
    setNoteTitle('')
    setNoteBody('')
  }

  return (
    <section className="section" style={{ marginTop: 0 }}>
      <div className="sheet-header">
        <div>
          <h1>{character.name}</h1>
          <p className="meta">
            Level {character.level} {character.race} {character.className}
            {character.subclass ? ` (${character.subclass})` : ''} · {character.background} ·{' '}
            {character.alignment}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link className="primary-btn" to={`/characters/${character.id}/session`}>
            Session Mode
          </Link>
          <Link className="ghost-btn" to="/characters">
            Roster
          </Link>
        </div>
      </div>

      <CharacterSearch character={character} onSelect={handleSearchSelect} />

      <div className="combat-bar">
        <div className="stat-chip">
          <span>Hit Points</span>
          <strong>
            {character.hp.current}/{character.hp.max}
          </strong>
          {character.hp.temp > 0 && <div className="meta">Temp +{character.hp.temp}</div>}
          <div className="hp-meter" aria-hidden="true">
            <i style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="stat-chip">
          <span>Armor Class</span>
          <strong>{character.armorClass}</strong>
        </div>
        <div className="stat-chip">
          <span>Initiative</span>
          <strong>{formatModifier(character.initiative)}</strong>
        </div>
        <div className="stat-chip">
          <span>Proficiency</span>
          <strong>{formatModifier(character.proficiencyBonus)}</strong>
        </div>
      </div>

      <div className="sheet-layout">
        <aside className="stat-stack">
          <div className="panel">
            <h3>Abilities</h3>
            <div className="ability-grid" style={{ gridTemplateColumns: '1fr' }}>
              {ABILITY_SHORT.map((key) => (
                <label key={key} className="ability-cell">
                  <strong>{ABILITY_LABELS[key]}</strong>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={character.abilities[key]}
                    onChange={(e) => setAbility(key, Number(e.target.value) || 1)}
                  />
                  <div className="mod">
                    {formatModifier(abilityModifier(character.abilities[key]))}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="tabs" role="tablist" aria-label="Sheet sections">
            {(
              [
                ['combat', 'Combat'],
                ['skills', 'Skills'],
                ['features', 'Features'],
                ['gear', 'Gear'],
                ['magic', 'Magic'],
                ['story', 'Story'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={tab === key ? 'active' : ''}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'combat' && (
            <div className="panel">
              <h2>Combat &amp; vitals</h2>
              <div className="form-grid">
                <label>
                  Current HP
                  <input
                    type="number"
                    value={character.hp.current}
                    onChange={(e) =>
                      patch({
                        hp: {
                          ...character.hp,
                          current: Number(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Max HP
                  <input
                    type="number"
                    value={character.hp.max}
                    onChange={(e) =>
                      patch({
                        hp: {
                          ...character.hp,
                          max: Math.max(1, Number(e.target.value) || 1),
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Temp HP
                  <input
                    type="number"
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
                  Armor class
                  <input
                    type="number"
                    value={character.armorClass}
                    onChange={(e) => patch({ armorClass: Number(e.target.value) || 10 })}
                  />
                </label>
                <label>
                  Speed
                  <input
                    type="number"
                    value={character.speed}
                    onChange={(e) => patch({ speed: Number(e.target.value) || 0 })}
                  />
                </label>
                <label>
                  Level
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={character.level}
                    onChange={(e) => {
                      const level = Math.min(20, Math.max(1, Number(e.target.value) || 1))
                      patch({
                        level,
                        proficiencyBonus: proficiencyBonusForLevel(level),
                        hitDice: `${level}${character.hitDice.replace(/^\d+/, '')}`,
                      })
                    }}
                  />
                </label>
                <label>
                  Subclass
                  <input
                    value={character.subclass ?? ''}
                    onChange={(e) => patch({ subclass: e.target.value })}
                    placeholder="e.g. Soulknife"
                  />
                </label>
                <label>
                  Inspiration
                  <select
                    value={character.inspiration ? 'yes' : 'no'}
                    onChange={(e) => patch({ inspiration: e.target.value === 'yes' })}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Attacks</h3>
              <div className="list-block">
                {(character.attacks ?? []).length === 0 && (
                  <p className="meta">No attacks listed yet.</p>
                )}
                {(character.attacks ?? []).map((a) => (
                  <div
                    key={a.id}
                    id={`search-attack-${a.id}`}
                    className={`list-row ${highlightId === `attack-${a.id}` ? 'search-highlight' : ''}`}
                  >
                    <div>
                      <strong>{a.name}</strong>
                      <div className="meta">
                        {a.bonus} to hit · {a.damage}
                        {a.notes ? ` · ${a.notes}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() =>
                        patch({
                          attacks: (character.attacks ?? []).filter((x) => x.id !== a.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="inline-form">
                <input
                  value={attackName}
                  onChange={(e) => setAttackName(e.target.value)}
                  placeholder="Attack name"
                />
                <input
                  value={attackBonus}
                  onChange={(e) => setAttackBonus(e.target.value)}
                  placeholder="+6"
                  style={{ flex: '0 0 90px' }}
                  aria-label="Attack bonus"
                />
                <input
                  value={attackDamage}
                  onChange={(e) => setAttackDamage(e.target.value)}
                  placeholder="1d6+4 psychic"
                />
                <button type="button" className="primary-btn" onClick={addAttack}>
                  Add
                </button>
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Saving throws</h3>
              <div className="skill-list">
                {ABILITY_SHORT.map((key) => {
                  const proficient = character.savingThrowProficiencies.includes(key)
                  const mod = savingThrowModifier(
                    character.abilities,
                    key,
                    proficient,
                    character.proficiencyBonus,
                  )
                  return (
                    <div key={key} className="skill-item">
                      <span>
                        {proficient ? '●' : '○'} {ABILITY_LABELS[key]}{' '}
                        <strong>{formatModifier(mod)}</strong>
                      </span>
                    </div>
                  )
                })}
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Features</h3>
              <p className="meta">
                {character.features.length} on this sheet — open the Features tab to add full cards
                (uses, range, recoveries).
              </p>
              <div className="list-block">
                {character.features.slice(0, 4).map((f) => (
                  <div key={f.id} className="list-row">
                    <div>
                      <strong>{f.name}</strong>
                      {f.description && <div className="meta">{f.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="ghost-btn"
                style={{ marginTop: '0.75rem' }}
                onClick={() => setTab('features')}
              >
                Manage features
              </button>
            </div>
          )}

          {tab === 'features' && (
            <div className="panel">
              <h2>Additional features</h2>
              <p className="meta" style={{ marginTop: 0 }}>
                Match your paper cards: level, action economy, uses, and effect text.
              </p>
              <div className="list-block">
                {character.features.length === 0 && (
                  <p className="meta">No features yet — add one below.</p>
                )}
                {character.features.map((f) => {
                  const uses = f.uses ?? { used: 0, total: 0 }
                  return (
                    <article
                      key={f.id}
                      id={`search-feature-${f.id}`}
                      className={`list-row ${highlightId === `feature-${f.id}` ? 'search-highlight' : ''}`}
                      style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.65rem' }}
                    >
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <strong>{f.name}</strong>
                          <div className="meta">
                            {[f.className, f.level != null ? `L${f.level}` : null, f.action, f.range]
                              .filter(Boolean)
                              .join(' · ') || 'Feature'}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() =>
                            patch({
                              features: character.features.filter((x) => x.id !== f.id),
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="form-grid" style={{ width: '100%' }}>
                        <label>
                          Class
                          <input
                            value={f.className ?? ''}
                            onChange={(e) => updateFeature(f.id, { className: e.target.value })}
                          />
                        </label>
                        <label>
                          Level
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={f.level ?? ''}
                            onChange={(e) =>
                              updateFeature(f.id, {
                                level: e.target.value === '' ? null : Number(e.target.value) || null,
                              })
                            }
                          />
                        </label>
                        <label>
                          Action
                          <input
                            value={f.action ?? ''}
                            onChange={(e) => updateFeature(f.id, { action: e.target.value })}
                            placeholder="Bonus action"
                          />
                        </label>
                        <label>
                          Save
                          <input
                            value={f.save ?? ''}
                            onChange={(e) => updateFeature(f.id, { save: e.target.value })}
                          />
                        </label>
                        <label>
                          Range
                          <input
                            value={f.range ?? ''}
                            onChange={(e) => updateFeature(f.id, { range: e.target.value })}
                          />
                        </label>
                        <label>
                          Duration
                          <input
                            value={f.duration ?? ''}
                            onChange={(e) => updateFeature(f.id, { duration: e.target.value })}
                          />
                        </label>
                        <label>
                          Value
                          <input
                            value={f.value ?? ''}
                            onChange={(e) => updateFeature(f.id, { value: e.target.value })}
                            placeholder="2d6 / PB×2"
                          />
                        </label>
                        <label>
                          Recovers
                          <input
                            value={f.recovers ?? ''}
                            onChange={(e) => updateFeature(f.id, { recovers: e.target.value })}
                            placeholder="Long rest"
                          />
                        </label>
                        <label>
                          Uses (used / total)
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button type="button" className="icon-btn" onClick={() => bumpFeatureUse(f.id, -1)}>
                              −
                            </button>
                            <span>
                              {uses.used} / {uses.total}
                            </span>
                            <button type="button" className="icon-btn" onClick={() => bumpFeatureUse(f.id, 1)}>
                              +
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={uses.total}
                              onChange={(e) =>
                                updateFeature(f.id, {
                                  uses: {
                                    used: Math.min(uses.used, Number(e.target.value) || 0),
                                    total: Math.max(0, Number(e.target.value) || 0),
                                  },
                                })
                              }
                              style={{ width: '4.5rem' }}
                              aria-label="Total uses"
                            />
                          </div>
                        </label>
                        <label className="full">
                          Effect
                          <textarea
                            value={f.description}
                            onChange={(e) => updateFeature(f.id, { description: e.target.value })}
                          />
                        </label>
                      </div>
                    </article>
                  )
                })}
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Add feature</h3>
              <div className="form-grid">
                <label className="full">
                  Name
                  <input
                    value={featureForm.name}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Shifting — Wildhunt"
                  />
                </label>
                <label>
                  Class
                  <input
                    value={featureForm.className}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, className: e.target.value }))}
                    placeholder="Rogue / Racial"
                  />
                </label>
                <label>
                  Level
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={featureForm.level}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, level: e.target.value }))}
                  />
                </label>
                <label>
                  Action
                  <input
                    value={featureForm.action}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, action: e.target.value }))}
                    placeholder="Bonus action"
                  />
                </label>
                <label>
                  Save
                  <input
                    value={featureForm.save}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, save: e.target.value }))}
                  />
                </label>
                <label>
                  Range
                  <input
                    value={featureForm.range}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, range: e.target.value }))}
                  />
                </label>
                <label>
                  Duration
                  <input
                    value={featureForm.duration}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="1 minute"
                  />
                </label>
                <label>
                  Value
                  <input
                    value={featureForm.value}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, value: e.target.value }))}
                  />
                </label>
                <label>
                  Recovers
                  <input
                    value={featureForm.recovers}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, recovers: e.target.value }))}
                    placeholder="Long rest"
                  />
                </label>
                <label>
                  Total uses
                  <input
                    type="number"
                    min={0}
                    value={featureForm.usesTotal}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, usesTotal: e.target.value }))}
                  />
                </label>
                <label className="full">
                  Effect
                  <textarea
                    value={featureForm.description}
                    onChange={(e) => setFeatureForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What the feature does…"
                  />
                </label>
              </div>
              <div className="actions-row">
                <span />
                <button type="button" className="primary-btn" onClick={addFeature}>
                  Add feature
                </button>
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="panel">
              <h2>Skills</h2>
              <p className="meta" style={{ marginTop: 0 }}>
                Check for proficiency. Use Expertise for double proficiency bonus.
              </p>
              <div className="list-block">
                {SKILLS.map((skill) => {
                  const proficient = character.skillProficiencies.includes(skill.key)
                  const expertise = (character.skillExpertise ?? []).includes(skill.key)
                  const mod = skillModifier(
                    character.abilities,
                    skill.key,
                    proficient,
                    character.proficiencyBonus,
                    expertise,
                  )
                  return (
                    <div
                      key={skill.key}
                      id={`search-skill-${skill.key}`}
                      className={`list-row ${highlightId === `skill-${skill.key}` ? 'search-highlight' : ''}`}
                    >
                      <span>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={proficient}
                            onChange={() => {
                              const next = proficient
                                ? character.skillProficiencies.filter((s) => s !== skill.key)
                                : [...character.skillProficiencies, skill.key]
                              const nextExpertise = proficient
                                ? (character.skillExpertise ?? []).filter((s) => s !== skill.key)
                                : (character.skillExpertise ?? [])
                              patch({
                                skillProficiencies: next,
                                skillExpertise: nextExpertise,
                              })
                            }}
                            style={{ width: 'auto' }}
                          />
                          {skill.label}{' '}
                          <span className="meta">({skill.ability.toUpperCase()})</span>
                        </label>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginLeft: '0.75rem',
                            cursor: proficient ? 'pointer' : 'not-allowed',
                            opacity: proficient ? 1 : 0.45,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={expertise}
                            disabled={!proficient}
                            onChange={() => {
                              const list = character.skillExpertise ?? []
                              const next = expertise
                                ? list.filter((s) => s !== skill.key)
                                : [...list, skill.key]
                              patch({ skillExpertise: next })
                            }}
                            style={{ width: 'auto' }}
                          />
                          <span className="meta">Expertise</span>
                        </label>
                      </span>
                      <strong>{formatModifier(mod)}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'gear' && (
            <div className="panel">
              <h2>Inventory &amp; coin</h2>
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
                  <label key={coin}>
                    {coin.toUpperCase()}
                    <input
                      type="number"
                      min={0}
                      value={character.currency?.[coin] ?? 0}
                      onChange={(e) =>
                        patch({
                          currency: {
                            ...(character.currency ?? {
                              cp: 0,
                              sp: 0,
                              ep: 0,
                              gp: 0,
                              pp: 0,
                            }),
                            [coin]: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="list-block">
                {character.inventory.length === 0 && <p className="meta">Pack is empty.</p>}
                {character.inventory.map((item) => (
                  <div
                    key={item.id}
                    id={`search-item-${item.id}`}
                    className={`list-row ${highlightId === `item-${item.id}` ? 'search-highlight' : ''}`}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <div className="meta">
                        ×{item.qty}
                        {item.notes ? ` · ${item.notes}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() =>
                          patch({
                            inventory: character.inventory.map((i) =>
                              i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
                            ),
                          })
                        }
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() =>
                          patch({
                            inventory: character.inventory
                              .map((i) =>
                                i.id === item.id ? { ...i, qty: i.qty - 1 } : i,
                              )
                              .filter((i) => i.qty > 0),
                          })
                        }
                      >
                        −
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="inline-form">
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Item name"
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                />
                <button type="button" className="primary-btn" onClick={addItem}>
                  Add item
                </button>
              </div>
            </div>
          )}

          {tab === 'magic' && (
            <div className="panel">
              <h2>Spells</h2>
              <div className="list-block">
                {character.spells.length === 0 && (
                  <p className="meta">No spells recorded yet.</p>
                )}
                {character.spells.map((spell) => (
                  <div
                    key={spell.id}
                    id={`search-spell-${spell.id}`}
                    className={`list-row ${highlightId === `spell-${spell.id}` ? 'search-highlight' : ''}`}
                  >
                    <div>
                      <strong>{spell.name}</strong>
                      <div className="meta">
                        {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                        {spell.prepared ? ' · Prepared' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() =>
                        patch({
                          spells: character.spells.filter((s) => s.id !== spell.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="inline-form">
                <input
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                  placeholder="Spell name"
                />
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={spellLevel}
                  onChange={(e) => setSpellLevel(Number(e.target.value) || 0)}
                  style={{ flex: '0 0 90px' }}
                  aria-label="Spell level"
                />
                <button type="button" className="primary-btn" onClick={addSpell}>
                  Add spell
                </button>
              </div>
            </div>
          )}

          {tab === 'story' && (
            <div className="panel">
              <h2>Personality &amp; notes</h2>
              <div
                id="search-appearance"
                className={`form-grid ${highlightId === 'appearance' ? 'search-highlight' : ''}`}
                style={{ padding: highlightId === 'appearance' ? '0.75rem' : undefined, borderRadius: 14 }}
              >
                <label>
                  Age
                  <input
                    value={character.appearance?.age ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, age: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Height
                  <input
                    value={character.appearance?.height ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, height: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Weight
                  <input
                    value={character.appearance?.weight ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, weight: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Eyes
                  <input
                    value={character.appearance?.eyes ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, eyes: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Skin
                  <input
                    value={character.appearance?.skin ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, skin: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Hair
                  <input
                    value={character.appearance?.hair ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, hair: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="full">
                  Distinguishing marks
                  <input
                    value={character.appearance?.marks ?? ''}
                    onChange={(e) =>
                      patch({
                        appearance: { ...character.appearance, marks: e.target.value },
                      })
                    }
                  />
                </label>
                <label
                  className={`full ${highlightId === 'traits' ? 'search-highlight' : ''}`}
                  id="search-traits"
                >
                  Traits
                  <textarea
                    value={character.personality.traits}
                    onChange={(e) =>
                      patch({
                        personality: { ...character.personality, traits: e.target.value },
                      })
                    }
                  />
                </label>
                <label
                  id="search-ideals"
                  className={highlightId === 'ideals' ? 'search-highlight' : ''}
                >
                  Ideals
                  <textarea
                    value={character.personality.ideals}
                    onChange={(e) =>
                      patch({
                        personality: { ...character.personality, ideals: e.target.value },
                      })
                    }
                  />
                </label>
                <label
                  id="search-bonds"
                  className={highlightId === 'bonds' ? 'search-highlight' : ''}
                >
                  Bonds
                  <textarea
                    value={character.personality.bonds}
                    onChange={(e) =>
                      patch({
                        personality: { ...character.personality, bonds: e.target.value },
                      })
                    }
                  />
                </label>
                <label
                  className={`full ${highlightId === 'flaws' ? 'search-highlight' : ''}`}
                  id="search-flaws"
                >
                  Flaws
                  <textarea
                    value={character.personality.flaws}
                    onChange={(e) =>
                      patch({
                        personality: { ...character.personality, flaws: e.target.value },
                      })
                    }
                  />
                </label>
                <label
                  className={`full ${highlightId === 'scratch' ? 'search-highlight' : ''}`}
                  id="search-scratch"
                >
                  Scratch pad
                  <textarea
                    value={character.sessionNotes}
                    onChange={(e) => patch({ sessionNotes: e.target.value })}
                    placeholder="Quick freeform notes…"
                  />
                </label>
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Session log</h3>
              <p className="meta">Add as many dated notes as you want — one per beat, clue, or session.</p>
              <div className="form-grid">
                <label>
                  Title
                  <input
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Session 4 — docks"
                  />
                </label>
                <label className="full">
                  Note
                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="What happened…"
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
                  <p className="meta">No session log entries yet.</p>
                )}
                {(character.sessionLog ?? []).map((note) => (
                  <div
                    key={note.id}
                    id={`search-note-${note.id}`}
                    className={`list-row ${highlightId === `note-${note.id}` ? 'search-highlight' : ''}`}
                    style={{ alignItems: 'flex-start' }}
                  >
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
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
