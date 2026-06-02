from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import os, hashlib, secrets
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client, Client

BASE_DIR     = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Supabase client (service-role key, never exposed to browser) ─────────────
sb: Client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def get_username(authorization: str = Header(...)) -> str:
    """Verify the session token and return the username."""
    token = authorization.removeprefix("Bearer ").strip()
    res = sb.table("profiles").select("username").eq("session_token", token).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return res.data[0]["username"]

# ── Pydantic models ───────────────────────────────────────────────────────────
class AuthRequest(BaseModel):
    username: str
    password: str

class SaveRequest(BaseModel):
    gold:               int
    boat_parts:         dict
    ability_parts:      dict
    unlocked_boats:     list
    unlocked_abilities: list

class GameResultRequest(BaseModel):
    wave_reached: int
    gold_earned:  int

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.post("/api/signup")
def signup(body: AuthRequest):
    if len(body.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check username taken
    existing = sb.table("profiles").select("username").eq("username", body.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already taken")

    salt          = secrets.token_hex(16)
    password_hash = hash_password(body.password, salt)
    session_token = secrets.token_hex(32)

    sb.table("profiles").insert({
        "username":           body.username,
        "password_hash":      password_hash,
        "salt":               salt,
        "session_token":      session_token,
        "gold":               0,
        "boat_parts":         {},
        "ability_parts":      {},
        "unlocked_boats":     [],
        "unlocked_abilities": [],
        "games_played":       0,
        "best_wave":          0,
    }).execute()

    return {"token": session_token, "username": body.username,
            "profile": {"gold": 0, "boat_parts": {}, "ability_parts": {},
                        "unlocked_boats": [], "unlocked_abilities": [],
                        "games_played": 0, "best_wave": 0}}

@app.post("/api/login")
def login(body: AuthRequest):
    res = sb.table("profiles").select("*").eq("username", body.username).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    profile = res.data[0]
    if hash_password(body.password, profile["salt"]) != profile["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Rotate session token on each login
    new_token = secrets.token_hex(32)
    sb.table("profiles").update({"session_token": new_token}).eq("username", body.username).execute()

    safe_profile = {k: profile[k] for k in
        ("gold", "boat_parts", "ability_parts", "unlocked_boats",
         "unlocked_abilities", "games_played", "best_wave")}
    return {"token": new_token, "username": body.username, "profile": safe_profile}

# ── Game routes ───────────────────────────────────────────────────────────────
@app.post("/api/save")
def save_progress(body: SaveRequest, username: str = Depends(get_username)):
    sb.table("profiles").update({
        "gold":               body.gold,
        "boat_parts":         body.boat_parts,
        "ability_parts":      body.ability_parts,
        "unlocked_boats":     body.unlocked_boats,
        "unlocked_abilities": body.unlocked_abilities,
    }).eq("username", username).execute()
    return {"ok": True}

@app.post("/api/game-result")
def record_game_result(body: GameResultRequest, username: str = Depends(get_username)):
    profile = sb.table("profiles").select("games_played,best_wave").eq("username", username).single().execute().data
    sb.table("profiles").update({
        "games_played": profile["games_played"] + 1,
        "best_wave":    max(profile["best_wave"], body.wave_reached),
    }).eq("username", username).execute()
    return {"ok": True}

# ── Static files ──────────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))