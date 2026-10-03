import type { Character, Feature } from '../types/character'
import { emptyAppearance, emptyCurrency } from './characterFactory'

const STORAGE_KEY = 'hearthbound.characters.v1'

function normalizeFeature(feature: Feature): Feature {
  return {
    ...feature,
    level: feature.level ?? null,
    className: feature.className ?? '',
    action: feature.action ?? '',
    save: feature.save ?? '',
    range: feature.range ?? '',
    duration: feature.duration ?? '',
    value: feature.value ?? '',
    recovers: feature.recovers ?? '',
    uses: feature.uses ?? { used: 0, total: 0 },
  }
}

function normalize(character: Character): Character {
  return {
    ...character,
    subclass: character.subclass ?? '',
    skillExpertise: character.skillExpertise ?? [],
    attacks: character.attacks ?? [],
    appearance: { ...emptyAppearance(), ...(character.appearance ?? {}) },
    currency: { ...emptyCurrency(), ...(character.currency ?? {}) },
    features: (character.features ?? []).map(normalizeFeature),
    sessionLog: character.sessionLog ?? [],
    sessionNotes: character.sessionNotes ?? '',
  }
}

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Character[]
    return Array.isArray(parsed) ? parsed.map(normalize) : []
  } catch {
    return []
  }
}

export function saveCharacters(characters: Character[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
}

export function uid(): string {
  return crypto.randomUUID()
}
