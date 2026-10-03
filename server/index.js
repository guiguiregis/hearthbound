import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import {
  issueToken,
  loginUser,
  registerUser,
  requireAuth,
  userFromAuthHeader,
} from './auth.js'
import { db } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 8787)

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hearthbound' })
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await registerUser(req.body || {})
    const token = await issueToken(user)
    res.status(201).json({ user, token })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Register failed.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await loginUser(req.body || {})
    const token = await issueToken(user)
    res.json({ user, token })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Login failed.' })
  }
})

app.get('/api/auth/me', async (req, res) => {
  const user = await userFromAuthHeader(req.headers.authorization)
  if (!user) {
    res.status(401).json({ error: 'Sign in required.' })
    return
  }
  res.json({ user })
})

app.get('/api/characters', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT data FROM characters WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id)
  const characters = rows.map((row) => JSON.parse(row.data))
  res.json({ characters })
})

app.post('/api/characters', requireAuth, (req, res) => {
  const character = req.body?.character
  if (!character || typeof character !== 'object') {
    res.status(400).json({ error: 'Character payload required.' })
    return
  }
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
  ).run(id, req.user.id, saved.name || 'Unnamed', JSON.stringify(saved), now, saved.createdAt)
  res.status(201).json({ character: saved })
})

app.put('/api/characters/:id', requireAuth, (req, res) => {
  const existing = db
    .prepare('SELECT id FROM characters WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id)
  if (!existing) {
    res.status(404).json({ error: 'Character not found.' })
    return
  }
  const character = req.body?.character
  if (!character || typeof character !== 'object') {
    res.status(400).json({ error: 'Character payload required.' })
    return
  }
  const now = new Date().toISOString()
  const saved = { ...character, id: req.params.id, updatedAt: now }
  db.prepare(
    `UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
  ).run(saved.name || 'Unnamed', JSON.stringify(saved), now, req.params.id, req.user.id)
  res.json({ character: saved })
})

app.delete('/api/characters/:id', requireAuth, (req, res) => {
  const result = db
    .prepare('DELETE FROM characters WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Character not found.' })
    return
  }
  res.status(204).end()
})

app.listen(PORT, () => {
  console.log(`Hearthbound API on http://localhost:${PORT}`)
})
