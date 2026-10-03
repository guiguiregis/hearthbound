import { useEffect, useMemo, useState } from 'react'
import {
  filterActions,
  suggestActions,
  type ActionKind,
  type ActionPreset,
  type SuggestedAction,
} from '../lib/actions'
import { fetchClassLevelFeatures, fetchSneakAttackHint } from '../lib/srdApi'
import type { Character } from '../types/character'

const KIND_LABEL: Record<ActionKind, string> = {
  attack: 'Attack',
  damage: 'Damage',
  check: 'Check',
  save: 'Save',
  initiative: 'Initiative',
  feature: 'Feature',
}

interface ActionHelperProps {
  character: Character
  onChoose: (action: SuggestedAction) => void
  selectedId?: string | null
}

export function ActionHelper({ character, onChoose, selectedId }: ActionHelperProps) {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<ActionKind | 'all'>('all')
  const [srdHint, setSrdHint] = useState<string | null>(null)
  const [srdFeatures, setSrdFeatures] = useState<string[]>([])

  const actions = useMemo(() => suggestActions(character), [character])
  const filtered = useMemo(() => {
    const byKind =
      kindFilter === 'all' ? actions : actions.filter((a) => a.kind === kindFilter)
    return filterActions(byKind, query)
  }, [actions, kindFilter, query])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (character.className.toLowerCase() !== 'rogue') {
        setSrdHint(null)
        setSrdFeatures([])
        return
      }
      const [hint, levelFeatures] = await Promise.all([
        fetchSneakAttackHint(),
        fetchClassLevelFeatures('rogue', character.level),
      ])
      if (cancelled) return
      setSrdHint(hint)
      setSrdFeatures(levelFeatures.map((f) => f.name))
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [character.className, character.level])

  return (
    <div className="panel action-helper">
      <h2>What are you doing?</h2>
      <p className="meta" style={{ marginTop: 0 }}>
        Pick a situation from your sheet. We&apos;ll tell you which dice to roll and which bonus to
        add, then you enter the faces you rolled.
      </p>

      <div className="form-grid">
        <label className="full">
          Filter actions
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="attack, stealth, sneak, dex save…"
          />
        </label>
      </div>

      <div className="tabs" style={{ marginTop: '0.75rem' }} role="tablist" aria-label="Action types">
        {(
          [
            ['all', 'All'],
            ['attack', 'Attacks'],
            ['damage', 'Damage'],
            ['check', 'Checks'],
            ['save', 'Saves'],
            ['feature', 'Features'],
            ['initiative', 'Init'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={kindFilter === key ? 'active' : ''}
            onClick={() => setKindFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="list-block">
        {filtered.length === 0 && <p className="meta">No matching actions.</p>}
        {filtered.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`list-row action-row ${selectedId === action.id ? 'search-highlight' : ''}`}
            onClick={() => onChoose(action)}
          >
            <div>
              <span className="char-search-cat">{KIND_LABEL[action.kind]}</span>
              <strong style={{ display: 'block' }}>{action.title}</strong>
              <div className="meta">{action.situation}</div>
              {action.hint && <div className="meta">{action.hint}</div>}
            </div>
            <div className="action-roll-badges">
              <span className="char-search-bonus">Roll {action.rollLabel}</span>
              <span className="action-bonus-chip">{action.bonusLabel}</span>
            </div>
          </button>
        ))}
      </div>

      {(srdHint || srdFeatures.length > 0) && (
        <div className="srd-hint">
          <h3>SRD tip{character.className ? ` · ${character.className}` : ''}</h3>
          {srdHint && <p className="meta">{srdHint}</p>}
          {srdFeatures.length > 0 && (
            <p className="meta" style={{ marginBottom: 0 }}>
              Level {character.level} features in SRD: {srdFeatures.join(', ')}.
              {character.subclass
                ? ` Subclass “${character.subclass}” may add more (not always in the SRD API).`
                : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export type { ActionPreset, SuggestedAction }
