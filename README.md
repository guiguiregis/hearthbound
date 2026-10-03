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

- Web: `http://localhost:5173`
- API: `http://localhost:8787` (proxied as `/api` in Vite)
- Data: SQLite at `server/data/hearthbound.sqlite` (gitignored)

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

### 1. Get the Supabase database URL

1. Open [supabase.com](https://supabase.com) → your project (or create one)
2. **Project Settings → Database → Connection string → URI**
3. Prefer the **Transaction** pooler (port **6543**) for Vercel serverless
4. Replace `[YOUR-PASSWORD]` with the database password

### 2. Set Vercel env vars

In **Vercel → Project → Settings → Environment Variables**:

| Name | Value | Environments |
|------|--------|--------------|
| `HEARTHBOUND_JWT_SECRET` | `openssl rand -hex 32` | Production (+ Preview) |
| `DATABASE_URL` | Supabase Postgres URI | Production (+ Preview) |

`SUPABASE_DB_URL` and `POSTGRES_URL` are also accepted.

### 3. Redeploy

Tables (`users`, `characters`) are created automatically on first API request.

Local SQLite accounts are not migrated — register again on production and recreate Damakos from the in-app preset if needed.

SPA routes rewrite to `index.html`; `/api/*` is handled by the serverless function (this fixes the production **405** that happened when POSTs hit the static SPA).

## Notes

- Never commit real secrets; see `.env.example`.
- SRD tips use the public [D&D 5e API](https://www.dnd5eapi.co/); full official books are not included.
