import { useEffect, useMemo, useState } from 'react'
import { ABILITY_LABELS, ABILITY_SHORT, SKILLS } from '../data/dnd'
import {
  buildBreakdown,
  emptyFaces,
  extractFlatBonus,
  parseDiceNotation,
  parseFaces,
  type RollBreakdown,
} from '../lib/dice'
import {
  abilityModifier,
  formatModifier,
  savingThrowModifier,
  skillModifier,
} from '../lib/stats'
import type { AbilityKey, Character, SkillKey } from '../types/character'

type ModMode = 'none' | 'custom' | 'ability' | 'save' | 'skill' | 'attack' | 'initiative' | 'proficiency'

interface DiceInputProps {
  character: Character
  onLog?: (breakdown: RollBreakdown) => void
}

export function DiceInput({ character, onLog }: DiceInputProps) {
  const [notation, setNotation] = useState('1d20')
  const [faces, setFaces] = useState<string[]>([''])
  const [modMode, setModMode] = useState<ModMode>('none')
  const [ability, setAbility] = useState<AbilityKey>('dex')
  const [skill, setSkill] = useState<SkillKey>('stealth')
  const [attackId, setAttackId] = useState(character.attacks[0]?.id ?? '')
  const [customMod, setCustomMod] = useState('0')
  const [error, setError] = useState('')
  const [result, setResult] = useState<RollBreakdown | null>(null)

  const parsed = useMemo(() => parseDiceNotation(notation), [notation])

  useEffect(() => {
    if (!parsed.ok) return
    setFaces((prev) => {
      if (prev.length === parsed.spec.count) return prev
      if (prev.length < parsed.spec.count) {
        return [...prev, ...emptyFaces(parsed.spec.count - prev.length)]
      }
      return prev.slice(0, parsed.spec.count)
    })
  }, [parsed])

  const modifierInfo = useMemo(() => {
    switch (modMode) {
      case 'none':
        return { value: 0, label: '' }
      case 'custom':
        return { value: Number(customMod) || 0, label: 'custom' }
      case 'ability':
        return {
          value: abilityModifier(character.abilities[ability]),
          label: ABILITY_LABELS[ability],
        }
      case 'save': {
        const proficient = character.savingThrowProficiencies.includes(ability)
        return {
          value: savingThrowModifier(
            character.abilities,
            ability,
            proficient,
            character.proficiencyBonus,
          ),
          label: `${ABILITY_LABELS[ability]} save`,
        }
      }
      case 'skill': {
        const proficient = character.skillProficiencies.includes(skill)
        const expertise = (character.skillExpertise ?? []).includes(skill)
        const meta = SKILLS.find((s) => s.key === skill)!
        return {
          value: skillModifier(
            character.abilities,
            skill,
            proficient,
            character.proficiencyBonus,
            expertise,
          ),
          label: meta.label,
        }
      }
      case 'attack': {
        const attack = character.attacks.find((a) => a.id === attackId) ?? character.attacks[0]
        if (!attack) return { value: 0, label: 'attack' }
        return {
          value: extractFlatBonus(attack.bonus),
          label: attack.name,
        }
      }
      case 'initiative':
        return { value: character.initiative, label: 'Initiative' }
      case 'proficiency':
        return { value: character.proficiencyBonus, label: 'Proficiency' }
      default:
        return { value: 0, label: '' }
    }
  }, [modMode, customMod, ability, skill, attackId, character])

  function setFaceAt(index: number, value: string) {
    setFaces((prev) => prev.map((f, i) => (i === index ? value : f)))
    setResult(null)
  }

  function calculate() {
    const dice = parseDiceNotation(notation)
    if (!dice.ok) {
      setError(dice.error)
      setResult(null)
      return
    }
    const faceResult = parseFaces(faces, dice.spec.sides)
    if (!faceResult.ok) {
      setError(faceResult.error)
      setResult(null)
      return
    }
    setError('')
    const breakdown = buildBreakdown(
      dice.notation,
      faceResult.values,
      dice.spec.sides,
      modifierInfo.value,
      modifierInfo.label,
    )
    setResult(breakdown)
  }

  function applyPreset(next: string, mode: ModMode) {
    setNotation(next)
    setModMode(mode)
    setResult(null)
    setError('')
  }

  return (
    <div className="panel dice-panel">
      <h2>Dice entry</h2>
      <p className="meta" style={{ marginTop: 0 }}>
        Enter what you rolled on the table. We&apos;ll add your modifiers and show the total.
      </p>

      <div className="cta-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="ghost-btn" onClick={() => applyPreset('1d20', 'attack')}>
          1d20 attack
        </button>
        <button type="button" className="ghost-btn" onClick={() => applyPreset('1d20', 'skill')}>
          1d20 check
        </button>
        <button type="button" className="ghost-btn" onClick={() => applyPreset('1d6', 'none')}>
          1d6
        </button>
        <button type="button" className="ghost-btn" onClick={() => applyPreset('2d6', 'none')}>
          2d6
        </button>
      </div>

      <div className="form-grid">
        <label>
          Dice (NdS)
          <input
            value={notation}
            onChange={(e) => {
              setNotation(e.target.value)
              setResult(null)
            }}
            placeholder="1d20 / 2d6 / 3d8"
          />
        </label>
        <label>
          Apply modifier
          <select
            value={modMode}
            onChange={(e) => {
              setModMode(e.target.value as ModMode)
              setResult(null)
            }}
          >
            <option value="none">None — dice only</option>
            <option value="attack">Attack bonus</option>
            <option value="skill">Skill check</option>
            <option value="save">Saving throw</option>
            <option value="ability">Ability modifier</option>
            <option value="initiative">Initiative</option>
            <option value="proficiency">Proficiency only</option>
            <option value="custom">Custom number</option>
          </select>
        </label>

        {modMode === 'ability' || modMode === 'save' ? (
          <label>
            Ability
            <select value={ability} onChange={(e) => setAbility(e.target.value as AbilityKey)}>
              {ABILITY_SHORT.map((key) => (
                <option key={key} value={key}>
                  {ABILITY_LABELS[key]} ({formatModifier(abilityModifier(character.abilities[key]))})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {modMode === 'skill' ? (
          <label>
            Skill
            <select value={skill} onChange={(e) => setSkill(e.target.value as SkillKey)}>
              {SKILLS.map((s) => {
                const proficient = character.skillProficiencies.includes(s.key)
                const expertise = (character.skillExpertise ?? []).includes(s.key)
                const mod = skillModifier(
                  character.abilities,
                  s.key,
                  proficient,
                  character.proficiencyBonus,
                  expertise,
                )
                return (
                  <option key={s.key} value={s.key}>
                    {s.label} ({formatModifier(mod)})
                  </option>
                )
              })}
            </select>
          </label>
        ) : null}

        {modMode === 'attack' ? (
          <label>
            Attack
            <select value={attackId} onChange={(e) => setAttackId(e.target.value)}>
              {character.attacks.length === 0 ? (
                <option value="">No attacks on sheet</option>
              ) : (
                character.attacks.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.bonus})
                  </option>
                ))
              )}
            </select>
          </label>
        ) : null}

        {modMode === 'custom' ? (
          <label>
            Custom modifier
            <input
              type="number"
              value={customMod}
              onChange={(e) => setCustomMod(e.target.value)}
            />
          </label>
        ) : null}

        <label className="full">
          Current modifier
          <div className="stat-chip" style={{ marginTop: '0.35rem' }}>
            <strong>
              {formatModifier(modifierInfo.value)}
              {modifierInfo.label ? ` · ${modifierInfo.label}` : ''}
            </strong>
          </div>
        </label>
      </div>

      <h3 style={{ marginTop: '1.25rem' }}>Die faces you rolled</h3>
      <p className="meta">
        {parsed.ok
          ? `Enter each ${parsed.spec.sides}-sided die (${parsed.spec.count} total). Example: 8 on 1d20, or 3 and 5 on 2d6.`
          : parsed.error}
      </p>
      <div className="dice-faces">
        {faces.map((face, index) => (
          <label key={index} className="dice-face">
            Die {index + 1}
            <input
              type="number"
              min={1}
              max={parsed.ok ? parsed.spec.sides : undefined}
              value={face}
              onChange={(e) => setFaceAt(index, e.target.value)}
              placeholder={parsed.ok ? `1–${parsed.spec.sides}` : '—'}
            />
          </label>
        ))}
      </div>

      {error && <p className="dice-error">{error}</p>}

      <div className="actions-row">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            setFaces(emptyFaces(parsed.ok ? parsed.spec.count : 1))
            setResult(null)
            setError('')
          }}
        >
          Clear faces
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="primary-btn" onClick={calculate}>
            Calculate total
          </button>
          {result && onLog ? (
            <button type="button" className="ghost-btn" onClick={() => onLog(result)}>
              Log to session
            </button>
          ) : null}
        </div>
      </div>

      {result && (
        <div className="dice-result" aria-live="polite">
          <div className="hp-display" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
            {result.total}
          </div>
          <p className="meta" style={{ margin: '0.35rem 0 0' }}>
            {result.summary}
          </p>
          {result.isNat20 && <p className="dice-flag success">Natural 20</p>}
          {result.isNat1 && <p className="dice-flag fail">Natural 1</p>}
          <div className="combat-bar" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <div className="stat-chip">
              <span>Dice</span>
              <strong>{result.diceTotal}</strong>
            </div>
            <div className="stat-chip">
              <span>Modifier</span>
              <strong>{formatModifier(result.modifier)}</strong>
            </div>
            <div className="stat-chip">
              <span>Total</span>
              <strong>{result.total}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
