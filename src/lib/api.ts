const TOKEN_KEY = 'hearthbound.auth.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...options, headers })
  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data as T
}

export type AuthUser = {
  id: string
  username: string
  displayName: string
}

export function register(input: {
  username: string
  password: string
  displayName?: string
}) {
  return api<{ user: AuthUser; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input: { username: string; password: string }) {
  return api<{ user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchMe() {
  return api<{ user: AuthUser }>('/api/auth/me')
}

export function fetchCharacters() {
  return api<{ characters: import('../types/character').Character[] }>('/api/characters')
}

export function createCharacter(character: import('../types/character').Character) {
  return api<{ character: import('../types/character').Character }>('/api/characters', {
    method: 'POST',
    body: JSON.stringify({ character }),
  })
}

export function updateCharacterRemote(character: import('../types/character').Character) {
  return api<{ character: import('../types/character').Character }>(
    `/api/characters/${character.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ character }),
    },
  )
}

export function deleteCharacterRemote(id: string) {
  return api<void>(`/api/characters/${id}`, { method: 'DELETE' })
}
