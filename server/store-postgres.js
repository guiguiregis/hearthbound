import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'
import {
  checkPassword,
  hashPassword,
  publicUser,
  validateRegisterInput,
} from './auth-core.js'

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!url) {
    throw Object.assign(
      new Error(
        'Production database is not configured. Add a Neon/Postgres DATABASE_URL in Vercel env vars.',
      ),
      { status: 503 },
    )
  }
  return neon(url)
}

let readyPromise

async function ensureSchema(sql) {
  if (!readyPromise) {
    readyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          data JSONB NOT NULL,
          updated_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id)`
    })()
  }
  await readyPromise
}

export function createPostgresStore() {
  const sql = getSql()

  return {
    async registerUser(input) {
      await ensureSchema(sql)
      const { cleanUser, cleanName, cleanPass } = validateRegisterInput(input)
      const existing = await sql`SELECT id FROM users WHERE lower(username) = lower(${cleanUser})`
      if (existing.length) {
        throw Object.assign(new Error('That username is already taken.'), { status: 409 })
      }
      const id = randomUUID()
      const now = new Date().toISOString()
      const passwordHash = await hashPassword(cleanPass)
      await sql`
        INSERT INTO users (id, username, display_name, password_hash, created_at)
        VALUES (${id}, ${cleanUser}, ${cleanName}, ${passwordHash}, ${now})
      `
      return publicUser({ id, username: cleanUser, display_name: cleanName })
    },

    async loginUser({ username, password }) {
      await ensureSchema(sql)
      const cleanUser = String(username || '').trim()
      const rows = await sql`SELECT * FROM users WHERE lower(username) = lower(${cleanUser})`
      const row = rows[0]
      if (!row) throw Object.assign(new Error('Invalid username or password.'), { status: 401 })
      const ok = await checkPassword(String(password || ''), row.password_hash)
      if (!ok) throw Object.assign(new Error('Invalid username or password.'), { status: 401 })
      return publicUser(row)
    },

    async getUserById(id) {
      await ensureSchema(sql)
      const rows = await sql`SELECT * FROM users WHERE id = ${id}`
      return rows[0] ? publicUser(rows[0]) : null
    },

    async listCharacters(userId) {
      await ensureSchema(sql)
      const rows = await sql`
        SELECT data FROM characters WHERE user_id = ${userId} ORDER BY updated_at DESC
      `
      return rows.map((row) => row.data)
    },

    async createCharacter(userId, character) {
      await ensureSchema(sql)
      const id = character.id || randomUUID()
      const now = new Date().toISOString()
      const saved = {
        ...character,
        id,
        createdAt: character.createdAt || now,
        updatedAt: now,
      }
      await sql`
        INSERT INTO characters (id, user_id, name, data, updated_at, created_at)
        VALUES (${id}, ${userId}, ${saved.name || 'Unnamed'}, ${saved}, ${now}, ${saved.createdAt})
      `
      return saved
    },

    async updateCharacter(userId, id, character) {
      await ensureSchema(sql)
      const existing = await sql`
        SELECT id FROM characters WHERE id = ${id} AND user_id = ${userId}
      `
      if (!existing.length) return null
      const now = new Date().toISOString()
      const saved = { ...character, id, updatedAt: now }
      await sql`
        UPDATE characters
        SET name = ${saved.name || 'Unnamed'},
            data = ${saved},
            updated_at = ${now}
        WHERE id = ${id} AND user_id = ${userId}
      `
      return saved
    },

    async deleteCharacter(userId, id) {
      await ensureSchema(sql)
      const result = await sql`
        DELETE FROM characters WHERE id = ${id} AND user_id = ${userId} RETURNING id
      `
      return result.length > 0
    },
  }
}
