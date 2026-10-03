import { createApp } from '../server/app.js'
import { createPostgresStore } from '../server/store-postgres.js'

// Export Express directly — serverless-http + Express 5 never finishes the response on Vercel.
const app = createApp(createPostgresStore())

export default app
