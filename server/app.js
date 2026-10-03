import cors from 'cors'
import express from 'express'
import { issueToken, verifyToken } from './auth-core.js'

export function createApp(store) {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  async function requireAuth(req, res, next) {
    try {
      const userId = await verifyToken(req.headers.authorization)
      if (!userId) {
        res.status(401).json({ error: 'Sign in required.' })
        return
      }
      const user = await store.getUserById(userId)
      if (!user) {
        res.status(401).json({ error: 'Sign in required.' })
        return
      }
      req.user = user
      next()
    } catch {
      res.status(401).json({ error: 'Sign in required.' })
    }
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'hearthbound',
      db:
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.SUPABASE_DB_URL
          ? 'postgres'
          : 'sqlite',
    })
  })

  app.post('/api/auth/register', async (req, res) => {
    try {
      const user = await store.registerUser(req.body || {})
      const token = await issueToken(user)
      res.status(201).json({ user, token })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Register failed.' })
    }
  })

  app.post('/api/auth/login', async (req, res) => {
    try {
      const user = await store.loginUser(req.body || {})
      const token = await issueToken(user)
      res.json({ user, token })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Login failed.' })
    }
  })

  app.get('/api/auth/me', async (req, res) => {
    try {
      const userId = await verifyToken(req.headers.authorization)
      if (!userId) {
        res.status(401).json({ error: 'Sign in required.' })
        return
      }
      const user = await store.getUserById(userId)
      if (!user) {
        res.status(401).json({ error: 'Sign in required.' })
        return
      }
      res.json({ user })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Auth failed.' })
    }
  })

  app.get('/api/characters', requireAuth, async (req, res) => {
    try {
      const characters = await store.listCharacters(req.user.id)
      res.json({ characters })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to load characters.' })
    }
  })

  app.post('/api/characters', requireAuth, async (req, res) => {
    try {
      const character = req.body?.character
      if (!character || typeof character !== 'object') {
        res.status(400).json({ error: 'Character payload required.' })
        return
      }
      const saved = await store.createCharacter(req.user.id, character)
      res.status(201).json({ character: saved })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to save character.' })
    }
  })

  app.put('/api/characters/:id', requireAuth, async (req, res) => {
    try {
      const character = req.body?.character
      if (!character || typeof character !== 'object') {
        res.status(400).json({ error: 'Character payload required.' })
        return
      }
      const saved = await store.updateCharacter(req.user.id, req.params.id, character)
      if (!saved) {
        res.status(404).json({ error: 'Character not found.' })
        return
      }
      res.json({ character: saved })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to update character.' })
    }
  })

  app.delete('/api/characters/:id', requireAuth, async (req, res) => {
    try {
      const ok = await store.deleteCharacter(req.user.id, req.params.id)
      if (!ok) {
        res.status(404).json({ error: 'Character not found.' })
        return
      }
      res.status(204).end()
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to delete character.' })
    }
  })

  return app
}
