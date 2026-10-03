import type { Character } from '../types/character'

const STORAGE_KEY = 'hearthbound.characters.v1'

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Character[]
    return Array.isArray(parsed) ? parsed : []
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
