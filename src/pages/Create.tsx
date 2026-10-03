import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ALIGNMENTS,
  BACKGROUNDS,
  CLASSES,
  RACES,
  SKILLS,
  STANDARD_ARRAY,
} from '../data/dnd'
import { useCharacters } from '../context/CharacterContext'
import {
  applyClassDefaults,
  createDraft,
  finalizeCharacter,
} from '../lib/characterFactory'
import { abilityModifier, formatModifier, suggestedMaxHp } from '../lib/stats'
import type { AbilityKey, CharacterDraft, SkillKey } from '../types/character'

const STEPS = ['Identity', 'Abilities', 'Skills', 'Details'] as const

export function Create() {
  const navigate = useNavigate()
  const { addCharacter } = useCharacters()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<CharacterDraft>(() => {
    const base = createDraft()
    return applyClassDefaults(base, base.className)
  })

  const cls = useMemo(
    () => CLASSES.find((c) => c.name === draft.className) ?? CLASSES[4],
    [draft.className],
  )

  function update(patch: Partial<CharacterDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function setAbility(key: AbilityKey, value: number) {
    const abilities = { ...draft.abilities, [key]: value }
    const max = suggestedMaxHp(cls.hitDie, abilities.con, draft.level)
    update({
      abilities,
      hp: { ...draft.hp, max, current: max },
    })
  }

  function toggleSkill(skill: SkillKey) {
    const has = draft.skillProficiencies.includes(skill)
    update({
      skillProficiencies: has
        ? draft.skillProficiencies.filter((s) => s !== skill)
        : [...draft.skillProficiencies, skill],
    })
  }

  function applyStandardArray() {
    const order: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    const abilities = { ...draft.abilities }
    order.forEach((key, i) => {
      abilities[key] = STANDARD_ARRAY[i]
    })
    const max = suggestedMaxHp(cls.hitDie, abilities.con, draft.level)
    update({ abilities, hp: { ...draft.hp, max, current: max } })
  }

  function canContinue() {
    if (step === 0) return draft.name.trim().length > 0
    return true
  }

  function finish() {
    if (!draft.name.trim()) return
    const dexAc = 10 + abilityModifier(draft.abilities.dex)
    const character = finalizeCharacter({
      ...draft,
      name: draft.name.trim(),
      armorClass: draft.armorClass === 10 ? dexAc : draft.armorClass,
      hitDice: `${draft.level}d${cls.hitDie}`,
    })
    addCharacter(character)
    navigate(`/characters/${character.id}`)
  }

  return (
    <section className="section" style={{ marginTop: 0 }}>
      <h1 className="section-title">Create character</h1>
      <p className="section-support">Four quick steps, then you&apos;re ready for Session Mode.</p>

      <div className="wizard-steps" aria-label="Creation steps">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`step-pill ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="panel">
        {step === 0 && (
          <div className="form-grid">
            <label className="full">
              Character name
              <input
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g. Mira Ashveil"
                autoFocus
              />
            </label>
            <label>
              Race
              <select value={draft.race} onChange={(e) => update({ race: e.target.value })}>
                {RACES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Class
              <select
                value={draft.className}
                onChange={(e) => setDraft((prev) => applyClassDefaults(prev, e.target.value))}
              >
                {CLASSES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subclass
              <input
                value={draft.subclass}
                onChange={(e) => update({ subclass: e.target.value })}
                placeholder="e.g. Soulknife"
              />
            </label>
            <label>
              Background
              <select
                value={draft.background}
                onChange={(e) => update({ background: e.target.value })}
              >
                {BACKGROUNDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Alignment
              <select
                value={draft.alignment}
                onChange={(e) => update({ alignment: e.target.value })}
              >
                {ALIGNMENTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Level
              <input
                type="number"
                min={1}
                max={20}
                value={draft.level}
                onChange={(e) => {
                  const level = Math.min(20, Math.max(1, Number(e.target.value) || 1))
                  const max = suggestedMaxHp(cls.hitDie, draft.abilities.con, level)
                  update({
                    level,
                    hitDice: `${level}d${cls.hitDie}`,
                    hp: { ...draft.hp, max, current: max },
                  })
                }}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <>
            <div className="actions-row" style={{ marginTop: 0, marginBottom: '1rem' }}>
              <p className="meta" style={{ margin: 0 }}>
                Set scores manually or drop in the standard array.
              </p>
              <button type="button" className="ghost-btn" onClick={applyStandardArray}>
                Use standard array
              </button>
            </div>
            <div className="ability-grid">
              {(Object.keys(draft.abilities) as AbilityKey[]).map((key) => (
                <label key={key} className="ability-cell">
                  <strong>{key.toUpperCase()}</strong>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={draft.abilities[key]}
                    onChange={(e) => setAbility(key, Number(e.target.value) || 1)}
                  />
                  <div className="mod">{formatModifier(abilityModifier(draft.abilities[key]))}</div>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="meta" style={{ marginTop: 0 }}>
              Saving throws for {draft.className}:{' '}
              {draft.savingThrowProficiencies.map((s) => s.toUpperCase()).join(', ')}
            </p>
            <div className="skill-list">
              {SKILLS.map((skill) => (
                <label key={skill.key} className="skill-item">
                  <input
                    type="checkbox"
                    checked={draft.skillProficiencies.includes(skill.key)}
                    onChange={() => toggleSkill(skill.key)}
                  />
                  <span>
                    {skill.label}{' '}
                    <span className="meta">({skill.ability.toUpperCase()})</span>
                  </span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="form-grid">
            <label>
              Max HP
              <input
                type="number"
                min={1}
                value={draft.hp.max}
                onChange={(e) => {
                  const max = Math.max(1, Number(e.target.value) || 1)
                  update({ hp: { current: max, max, temp: 0 } })
                }}
              />
            </label>
            <label>
              Armor class
              <input
                type="number"
                min={1}
                value={draft.armorClass}
                onChange={(e) => update({ armorClass: Number(e.target.value) || 10 })}
              />
            </label>
            <label>
              Speed
              <input
                type="number"
                min={0}
                value={draft.speed}
                onChange={(e) => update({ speed: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              Starting gear note
              <input
                value={draft.inventory[0]?.name ?? ''}
                onChange={(e) =>
                  update({
                    inventory: e.target.value
                      ? [{ id: 'starter', name: e.target.value, qty: 1 }]
                      : [],
                  })
                }
                placeholder="Longsword, explorer's pack…"
              />
            </label>
            <label className="full">
              Personality traits
              <textarea
                value={draft.personality.traits}
                onChange={(e) =>
                  update({ personality: { ...draft.personality, traits: e.target.value } })
                }
              />
            </label>
            <label>
              Ideals
              <textarea
                value={draft.personality.ideals}
                onChange={(e) =>
                  update({ personality: { ...draft.personality, ideals: e.target.value } })
                }
              />
            </label>
            <label>
              Bonds
              <textarea
                value={draft.personality.bonds}
                onChange={(e) =>
                  update({ personality: { ...draft.personality, bonds: e.target.value } })
                }
              />
            </label>
            <label className="full">
              Flaws
              <textarea
                value={draft.personality.flaws}
                onChange={(e) =>
                  update({ personality: { ...draft.personality, flaws: e.target.value } })
                }
              />
            </label>
          </div>
        )}

        <div className="actions-row">
          <button
            type="button"
            className="ghost-btn"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="primary-btn"
              disabled={!canContinue()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="primary-btn" onClick={finish}>
              Save character
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
