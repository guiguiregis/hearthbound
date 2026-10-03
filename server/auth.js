import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'node:crypto'
import { db } from './db.js'

const JWT_SECRET = new TextEncoder().encode(
  process.env.HEARTHBOUND_JWT_SECRET || 'hearthbound-dev-secret-change-me',
)
const TOKEN_TTL = '30d'

export async function registerUser({ username, password, displayName }) {
  const cleanUser = String(username || '').trim()
  const cleanName = String(displayName || cleanUser).trim()
  const cleanPass = String(password || '')

  if (cleanUser.length < 3) throw Object.assign(new Error('Username must be at least 3 characters.'), { status: 400 })
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
    throw Object.assign(new Error('Username can only use letters, numbers, _ and -.'), { status: 400 })
  }
  if (cleanPass.length < 6) throw Object.assign(new Error('Password must be at least 6 characters.'), { status: 400 })

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser)
  if (existing) throw Object.assign(new Error('That username is already taken.'), { status: 409 })

  const id = randomUUID()
  const now = new Date().toISOString()
  const passwordHash = await bcrypt.hash(cleanPass, 10)

  db.prepare(
    `INSERT INTO users (id, username, display_name, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, cleanUser, cleanName || cleanUser, passwordHash, now)

  return publicUser({ id, username: cleanUser, display_name: cleanName || cleanUser })
}

export async function loginUser({ username, password }) {
  const cleanUser = String(username || '').trim()
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUser)
  if (!row) throw Object.assign(new Error('Invalid username or password.'), { status: 401 })

  const ok = await bcrypt.compare(String(password || ''), row.password_hash)
  if (!ok) throw Object.assign(new Error('Invalid username or password.'), { status: 401 })

  return publicUser(row)
}

export async function issueToken(user) {
  return new SignJWT({ sub: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(JWT_SECRET)
}

export async function userFromAuthHeader(header) {
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
    return row ? publicUser(row) : null
  } catch {
    return null
  }
}

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  }
}

export function requireAuth(req, res, next) {
  userFromAuthHeader(req.headers.authorization)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'Sign in required.' })
        return
      }
      req.user = user
      next()
    })
    .catch(() => res.status(401).json({ error: 'Sign in required.' }))
}
