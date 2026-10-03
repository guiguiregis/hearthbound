import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import type { Character } from '../types/character'
import { touch } from '../lib/characterFactory'
import {
  createCharacter,
  deleteCharacterRemote,
  fetchCharacters,
  updateCharacterRemote,
} from '../lib/api'

interface CharacterContextValue {
  characters: Character[]
  ready: boolean
  getCharacter: (id: string) => Character | undefined
  addCharacter: (character: Character) => Promise<void>
  updateCharacter: (id: string, patch: Partial<Character>) => void
  deleteCharacter: (id: string) => Promise<void>
  refreshCharacters: () => Promise<void>
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [ready, setReady] = useState(false)
  const saveTimers = useRef<Record<string, number>>({})

  const refreshCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([])
      return
    }
    const res = await fetchCharacters()
    setCharacters(res.characters)
  }, [user])

  useEffect(() => {
    if (!authReady) return
    let cancelled = false
    setReady(false)
    if (!user) {
      setCharacters([])
      setReady(true)
      return
    }
    fetchCharacters()
      .then((res) => {
        if (!cancelled) setCharacters(res.characters)
      })
      .catch(() => {
        if (!cancelled) setCharacters([])
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [authReady, user])

  const getCharacter = useCallback(
    (id: string) => characters.find((c) => c.id === id),
    [characters],
  )

  const addCharacter = useCallback(
    async (character: Character) => {
      if (!user) throw new Error('Sign in to save characters.')
      const res = await createCharacter(character)
      setCharacters((prev) => [res.character, ...prev.filter((c) => c.id !== res.character.id)])
    },
    [user],
  )

  const updateCharacter = useCallback(
    (id: string, patch: Partial<Character>) => {
      if (!user) return
      setCharacters((prev) => {
        const next = prev.map((c) => (c.id === id ? touch(c, patch) : c))
        const updated = next.find((c) => c.id === id)
        if (updated) {
          window.clearTimeout(saveTimers.current[id])
          saveTimers.current[id] = window.setTimeout(() => {
            void updateCharacterRemote(updated).catch(() => {
              /* keep local optimistic state; next edit retries */
            })
          }, 400)
        }
        return next
      })
    },
    [user],
  )

  const deleteCharacter = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteCharacterRemote(id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
    },
    [user],
  )

  const value = useMemo(
    () => ({
      characters,
      ready: ready && authReady,
      getCharacter,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      refreshCharacters,
    }),
    [
      characters,
      ready,
      authReady,
      getCharacter,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      refreshCharacters,
    ],
  )

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>
}

export function useCharacters() {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useCharacters must be used within CharacterProvider')
  return ctx
}
