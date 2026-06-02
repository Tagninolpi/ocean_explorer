# Ocean Explorer — Claude Context File
Generated: Mon Jun  1 09:00:53 PM CEST 2026

## What to tell Claude at the start of a new chat
Paste this at the top of your message:
> "Here is my Ocean Explorer game project. [describe what you want to work on]"

---

## Project overview
A browser-based ocean wave-survival game.
- **Backend:** FastAPI (Python) served from `backend/main.py`
- **Frontend:** Vanilla JS + HTML canvas, no framework
- **Database:** Supabase (Postgres) — own auth system, no Supabase Auth
- **Hosting:** Render free tier (render.yaml at root)

---

## File tree
```
.
./backend
./backend/main.py
./backend/__pycache__
./backend/routes
./backend/routes/__init__.py
./CLAUDE_CONTEXT.md
./final_description.odt
./frontend
./frontend/assets
./frontend/assets/images
./frontend/css
./frontend/css/style.css
./frontend/index.html
./frontend/js
./frontend/js/data.js
./frontend/js/game
./frontend/js/game/collision.js
./frontend/js/game/enemies.js
./frontend/js/game/equipment.js
./frontend/js/game/game.js
./frontend/js/game/map.js
./frontend/js/game/player.js
./frontend/js/game/scrap.js
./frontend/js/ui
./frontend/js/ui/account.js
./frontend/js/ui/pages.js
./.git
./.gitignore
./make_archive.sh
./render.yaml
./requirements.txt
./venv
```

---

## Architecture

### Backend (`backend/main.py`)
- Own username/password auth — no email, no Supabase Auth
- Passwords: SHA-256 + random salt, stored in `profiles` table
- Sessions: random 64-char token stored in `profiles.session_token`
- Endpoints: POST /api/signup, POST /api/login, POST /api/save, POST /api/game-result
- Static files served from `../frontend` using absolute Path(__file__) resolution

### Frontend script load order (critical — breaks if changed)
```
data.js → equipment.js → map.js → player.js → enemies.js →
collision.js → account.js → pages.js → scrap.js → game.js
```

### Supabase `profiles` table schema
```sql
username            text primary key
password_hash       text
salt                text
session_token       text
gold                integer default 0
boat_parts          jsonb default '{}'
ability_parts       jsonb default '{}'
unlocked_boats      jsonb default '[]'
unlocked_abilities  jsonb default '[]'
games_played        integer default 0
best_wave           integer default 0
created_at          timestamptz default now()
```

---

## Key design decisions
- Equipment only obtainable from enemy death drops (10% chance)
- Every boat starts with a default R1 cannon in slot 0 (except inflatable_boat which has minigun)
- Enemies slow to 30% speed when within their weapon range (to avoid ramming)
- Player-enemy collision damage has 1.5s cooldown per enemy
- cargoUsed tracks both equipped items AND cargo list stacks
- Wave system: _waveStartPending flag prevents double wave starts
- Game over calls saveProgress() + recordGameResult() then returns to menu (no location.reload())
- account.js defines: session, handleLogin, handleCreate, handleLogout, saveProgress, recordGameResult
- pages.js must NOT redefine session or auth functions (they live in account.js)

---

## Bugs fixed (don't reintroduce)
- enemies.js was missing from index.html script tags entirely
- scrap.js was missing from index.html script tags
- update() loop only called updatePlayer() — enemies never moved or attacked
- _collectScrap_orig and similar _orig captures used before functions defined (JS hoisting)
- addToCargo never incremented cargoUsed for non-equipment items
- recalcCargoUsed only counted equipped items, not cargoList entries
- handleZoomInput defined twice — first copy removed, triggerZoomCooldown accidentally removed with it (restored)
- Wave double-start race condition between timer expiry and checkWaveCompletion
- main.py used relative path "frontend/" which broke depending on working directory
- pages.js redeclared const session (conflict with account.js) — auth functions removed from pages.js
- Supabase Auth rejected fake .local email domain — replaced entire auth with own hash/token system

---

## Environment
- Local: `.env` at project root with SUPABASE_URL and SUPABASE_KEY
- Render: env vars set manually in dashboard (never committed)
- Python venv at `venv/` (excluded from archive)

## Local dev command
```bash
source venv/bin/activate
uvicorn backend.main:app --reload
```
