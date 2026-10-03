import serverless from 'serverless-http'
import { createApp } from '../server/app.js'
import { createPostgresStore } from '../server/store-postgres.js'

let handler

export default async function vercelHandler(req, res) {
  if (!handler) {
    try {
      const app = createApp(createPostgresStore())
      handler = serverless(app)
    } catch (err) {
      res.statusCode = err.status || 503
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error:
            err.message ||
            'API is not configured. Set DATABASE_URL (Supabase) and HEARTHBOUND_JWT_SECRET in Vercel.',
        }),
      )
      return
    }
  }
  return handler(req, res)
}
