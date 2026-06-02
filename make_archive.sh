#!/bin/bash

# Run this from anywhere — it always operates on the boat_game directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE_NAME="ocean_explorer_$(date +%Y%m%d_%H%M).zip"
ARCHIVE_PATH="$PROJECT_DIR/$ARCHIVE_NAME"
CONTEXT_FILE="$PROJECT_DIR/CLAUDE_CONTEXT.md"

echo "Project dir: $PROJECT_DIR"
echo "Building file tree..."

# Build file tree (same as your find command)
TREE=$(find "$PROJECT_DIR" \
    -not -path "*/venv/*" \
    -not -path "*/.git/*" \
    -not -path "*/__pycache__/*" \
    -not -name "*.pyc" \
    -not -name ".env" \
    | sort | sed "s|$PROJECT_DIR|.|")

# Write CLAUDE_CONTEXT.md
cat > "$CONTEXT_FILE" << CONTEXT
# Ocean Explorer — Claude Context File
Generated: $(date)

## What to tell Claude at the start of a new chat
Paste this at the top of your message:
> "Here is my Ocean Explorer game project. [describe what you want to work on]"

---

## Project overview
A browser-based ocean wave-survival game.
- **Backend:** FastAPI (Python) served from \`backend/main.py\`
- **Frontend:** Vanilla JS + HTML canvas, no framework
- **Database:** Supabase (Postgres) — own auth system, no Supabase Auth
- **Hosting:** Render free tier (render.yaml at root)

---

## File tree
\`\`\`
$TREE
\`\`\`

---

## Architecture

### Backend (\`backend/main.py\`)
- Own username/password auth — no email, no Supabase Auth
- Passwords: SHA-256 + random salt, stored in \`profiles\` table
- Sessions: random 64-char token stored in \`profiles.session_token\`
- Endpoints: POST /api/signup, POST /api/login, POST /api/save, POST /api/game-result
- Static files served from \`../frontend\` using absolute Path(__file__) resolution

### Frontend script load order (critical — breaks if changed)
\`\`\`
data.js → equipment.js → map.js → player.js → enemies.js →
collision.js → account.js → pages.js → scrap.js → game.js
\`\`\`

### Supabase \`profiles\` table schema
\`\`\`sql
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
\`\`\`

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
- Local: \`.env\` at project root with SUPABASE_URL and SUPABASE_KEY
- Render: env vars set manually in dashboard (never committed)
- Python venv at \`venv/\` (excluded from archive)

## Local dev command
\`\`\`bash
source venv/bin/activate
uvicorn backend.main:app --reload
\`\`\`
CONTEXT

echo "Written: CLAUDE_CONTEXT.md"

# Create zip (exclude venv, .git, __pycache__, .env, previous archives)
cd "$PROJECT_DIR"
zip -r "$ARCHIVE_PATH" . \
    --exclude "*venv/*" \
    --exclude "*/.git/*" \
    --exclude ".git/*" \
    --exclude "*__pycache__*" \
    --exclude "*.pyc" \
    --exclude ".env" \
    --exclude "*.zip"

echo "Archive created: $ARCHIVE_NAME"
echo "Upload $ARCHIVE_NAME to Claude and describe what you want to work on."
