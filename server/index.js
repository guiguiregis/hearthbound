import { createApp } from './app.js'
import { createSqliteStore } from './store-sqlite.js'

const PORT = Number(process.env.PORT || 8787)
const app = createApp(createSqliteStore())

app.listen(PORT, () => {
  console.log(`Hearthbound API on http://localhost:${PORT}`)
})
