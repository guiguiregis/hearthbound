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

## Notes

- Set `HEARTHBOUND_JWT_SECRET` in production.
- SRD tips use the public [D&D 5e API](https://www.dnd5eapi.co/); full official books are not included.
