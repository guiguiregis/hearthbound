import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Character } from '../types/character'
import { touch } from '../lib/characterFactory'
import { loadCharacters, saveCharacters } from '../lib/storage'

interface CharacterContextValue {
  characters: Character[]
  ready: boolean
  getCharacter: (id: string) => Character | undefined
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, patch: Partial<Character>) => void
  deleteCharacter: (id: string) => void
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setCharacters(loadCharacters())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveCharacters(characters)
  }, [characters, ready])

  const getCharacter = useCallback(
    (id: string) => characters.find((c) => c.id === id),
    [characters],
  )

  const addCharacter = useCallback((character: Character) => {
    setCharacters((prev) => [character, ...prev])
  }, [])

  const updateCharacter = useCallback((id: string, patch: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? touch(c, patch) : c)),
    )
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      characters,
      ready,
      getCharacter,
      addCharacter,
      updateCharacter,
      deleteCharacter,
    }),
    [characters, ready, getCharacter, addCharacter, updateCharacter, deleteCharacter],
  )

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>
}

export function useCharacters() {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useCharacters must be used within CharacterProvider')
  return ctx
}
