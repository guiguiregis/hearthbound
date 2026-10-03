import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  checkPassword,
  hashPassword,
  publicUser,
  validateRegisterInput,
} from './auth-core.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'hearthbound.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);
`)

export function createSqliteStore() {
  return {
    async registerUser(input) {
      const { cleanUser, cleanName, cleanPass } = validateRegisterInput(input)
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser)
      if (existing) throw Object.assign(new Error('That username is already taken.'), { status: 409 })
      const id = randomUUID()
      const now = new Date().toISOString()
      const passwordHash = await hashPassword(cleanPass)
      db.prepare(
        `INSERT INTO users (id, username, display_name, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(id, cleanUser, cleanName, passwordHash, now)
      return publicUser({ id, username: cleanUser, display_name: cleanName })
    },

    async loginUser({ username, password }) {
      const cleanUser = String(username || '').trim()
      const row = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUser)
      if (!row) throw Object.assign(new Error('Invalid username or password.'), { status: 401 })
      const ok = await checkPassword(String(password || ''), row.password_hash)
      if (!ok) throw Object.assign(new Error('Invalid username or password.'), { status: 401 })
      return publicUser(row)
    },

    async getUserById(id) {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      return row ? publicUser(row) : null
    },

    async listCharacters(userId) {
      const rows = db
        .prepare('SELECT data FROM characters WHERE user_id = ? ORDER BY updated_at DESC')
        .all(userId)
      return rows.map((row) => JSON.parse(row.data))
    },

    async createCharacter(userId, character) {
      const id = character.id || randomUUID()
      const now = new Date().toISOString()
      const saved = {
        ...character,
        id,
        createdAt: character.createdAt || now,
        updatedAt: now,
      }
      db.prepare(
        `INSERT INTO characters (id, user_id, name, data, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, userId, saved.name || 'Unnamed', JSON.stringify(saved), now, saved.createdAt)
      return saved
    },

    async updateCharacter(userId, id, character) {
      const existing = db
        .prepare('SELECT id FROM characters WHERE id = ? AND user_id = ?')
        .get(id, userId)
      if (!existing) return null
      const now = new Date().toISOString()
      const saved = { ...character, id, updatedAt: now }
      db.prepare(
        `UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      ).run(saved.name || 'Unnamed', JSON.stringify(saved), now, id, userId)
      return saved
    },

    async deleteCharacter(userId, id) {
      const result = db
        .prepare('DELETE FROM characters WHERE id = ? AND user_id = ?')
        .run(id, userId)
      return result.changes > 0
    },
  }
}
