# Hearthbound

A multi-player D&D character ledger: each user creates an account and keeps their own sheets, with session tools for HP, conditions, dice, and notes.

## Features

- **Accounts** — register / sign in; sheets are private per user
- **Create** — guided wizard for identity, abilities, skills, and details
- **Sheet** — combat stats, skills, inventory, spells, features, story
- **Session Mode** — HP, conditions, death saves, rests, action helper + dice entry
- **Search** — find skills, attacks, gear, and notes (with bonuses)

## Run (API + web)

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:8787` (proxied as `/api` in Vite)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | API + Vite together |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | Backend only |
| `npm run build` | Production frontend build |

Data is stored in `server/data/hearthbound.sqlite` (gitignored).

## Vercel (frontend)

1. Deploy the Vite app to Vercel (Root Directory = repo root, Build = `npm run build`, Output = `dist`).
2. In **Project → Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `HEARTHBOUND_JWT_SECRET` | a long random secret (generate with `openssl rand -hex 32`) |

Apply to **Production** (and Preview if you want). Redeploy after saving.

3. The Express + SQLite API in `server/` does **not** run on Vercel serverless as-is. Host the API separately (Railway, Render, Fly, a VPS) and point the frontend at it, or keep using `npm run dev` locally for full-stack.

For a separate API host, set the same `HEARTHBOUND_JWT_SECRET` there and expose `PORT`.

## Notes

- Set `HEARTHBOUND_JWT_SECRET` in production (never use the dev default).
- SRD tips use the public [D&D 5e API](https://www.dnd5eapi.co/); full official books are not included.
