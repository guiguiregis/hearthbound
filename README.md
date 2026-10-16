# Hearthbound

A multi-player D&D character ledger: each user creates an account and keeps their own sheets, with session tools for HP, conditions, dice, and notes.

## Features

- **Accounts** — register / sign in; sheets are private per user
- **Create** — guided wizard for identity, abilities, skills, and details
- **Sheet** — combat stats, skills, inventory, spells, features, story
- **Session Mode** — HP, conditions, death saves, rests, action helper + dice entry
- **Search** — find skills, attacks, gear, and notes (with bonuses)

## Run locally (API + web)

```bash
npm install
npm run dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | API + Vite together |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | Backend only (SQLite) |
| `npm run build` | Production frontend build |
| `npm start` | API only (SQLite) |

## Deploy on Vercel + Supabase

Production uses a serverless Express handler in `api/[...path].js` with **Supabase Postgres**.


### 3. Redeploy

Tables (`users`, `characters`) are created automatically on first API request.

Local SQLite accounts are not migrated — register again on production and recreate Damakos from the in-app preset if needed.

SPA routes rewrite to `index.html`; `/api/*` is handled by the serverless function (this fixes the production **405** that happened when POSTs hit the static SPA).

## Notes

- Never commit real secrets; see `.env.example`.
- SRD tips use the public [D&D 5e API](https://www.dnd5eapi.co/); full official books are not included.
