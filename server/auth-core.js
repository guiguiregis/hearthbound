import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.HEARTHBOUND_JWT_SECRET || 'hearthbound-dev-secret-change-me',
)
const TOKEN_TTL = '30d'

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  }
}

export async function issueToken(user) {
  return new SignJWT({ sub: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(JWT_SECRET)
}

export async function verifyToken(header) {
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function checkPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export function validateRegisterInput({ username, password, displayName }) {
  const cleanUser = String(username || '').trim()
  const cleanName = String(displayName || cleanUser).trim()
  const cleanPass = String(password || '')

  if (cleanUser.length < 3) {
    throw Object.assign(new Error('Username must be at least 3 characters.'), { status: 400 })
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
    throw Object.assign(new Error('Username can only use letters, numbers, _ and -.'), {
      status: 400,
    })
  }
  if (cleanPass.length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters.'), { status: 400 })
  }

  return { cleanUser, cleanName: cleanName || cleanUser, cleanPass }
}
