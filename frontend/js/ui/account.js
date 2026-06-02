// ============================================================
// ACCOUNT — auth + persistent profile
// Replaces placeholder session logic in pages.js
// ============================================================

const session = {
    token:    null,
    username: null,
    profile:  null,   // full profile from server
};

// ── Persistent gold & parts (in-memory during a run, saved on game end) ──
let persistentGold        = 0;
let persistentBoatParts   = {};   // { "1": 12, "2": 5, ... }
let persistentAbilityParts= {};
let unlockedBoats         = [];
let unlockedAbilities     = [];

function loadProfileIntoMemory(profile) {
    persistentGold         = profile.gold              ?? 0;
    persistentBoatParts    = profile.boat_parts        ?? {};
    persistentAbilityParts = profile.ability_parts     ?? {};
    unlockedBoats          = profile.unlocked_boats    ?? [];
    unlockedAbilities      = profile.unlocked_abilities?? [];
}

// ── API helpers ──────────────────────────────────────────────
async function apiPost(path, body, withAuth = false) {
    const headers = { "Content-Type": "application/json" };
    if (withAuth) headers["Authorization"] = "Bearer " + session.token;
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data;
}

async function apiGet(path) {
    const headers = { "Authorization": "Bearer " + session.token };
    const res = await fetch(path, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data;
}

// ── Login / Signup ───────────────────────────────────────────
async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const error    = document.getElementById('login-error');
    error.textContent = '';

    if (!username || !password) { error.textContent = 'Please fill in both fields.'; return; }

    try {
        const data = await apiPost('/api/login', { username, password });
        session.token    = data.token;
        session.username = username;
        session.profile  = data.profile;
        loadProfileIntoMemory(data.profile);
        document.getElementById('display-username').textContent = username;
        showPage('page-main-menu');
    } catch (e) {
        error.textContent = e.message;
    }
}

async function handleCreate() {
    const username = document.getElementById('create-username').value.trim();
    const password = document.getElementById('create-password').value.trim();
    const error    = document.getElementById('create-error');
    error.textContent = '';

    if (!username || !password) { error.textContent = 'Please fill in both fields.'; return; }
    if (username.length < 3)    { error.textContent = 'Username must be at least 3 characters.'; return; }
    if (password.length < 6)    { error.textContent = 'Password must be at least 6 characters.'; return; }

    try {
        const data = await apiPost('/api/signup', { username, password });
        session.token    = data.token;
        session.username = username;
        session.profile  = { gold: 0, boat_parts: {}, ability_parts: {}, unlocked_boats: [], unlocked_abilities: [] };
        loadProfileIntoMemory(session.profile);
        document.getElementById('display-username').textContent = username;
        showPage('page-main-menu');
    } catch (e) {
        error.textContent = e.message;
    }
}

function handleLogout() {
    session.token    = null;
    session.username = null;
    session.profile  = null;
    showPage('page-identification');
}

// ── Save progress (called on game over and on port unload) ───
async function saveProgress() {
    if (!session.token) return;   // not logged in

    // Collect current cargo gold/parts into persistent totals
    if (typeof cargoList !== 'undefined') {
        for (const item of cargoList) {
            if (item.type === 'gold') {
                persistentGold += item.amount;
            } else if (item.type === 'boat_part') {
                const key = String(item.rarity);
                persistentBoatParts[key] = (persistentBoatParts[key] || 0) + item.amount;
            } else if (item.type === 'ability_part') {
                const key = String(item.rarity);
                persistentAbilityParts[key] = (persistentAbilityParts[key] || 0) + item.amount;
            }
        }
    }

    try {
        await apiPost('/api/save', {
            gold:               persistentGold,
            boat_parts:         persistentBoatParts,
            ability_parts:      persistentAbilityParts,
            unlocked_boats:     unlockedBoats,
            unlocked_abilities: unlockedAbilities,
        }, true);
    } catch (e) {
        console.warn('Save failed:', e.message);
    }
}

// ── Record game result (called on game over) ─────────────────
async function recordGameResult(waveReached) {
    if (!session.token) return;
    try {
        await apiPost('/api/game-result', {
            wave_reached: waveReached,
            gold_earned:  persistentGold,
        }, true);
    } catch (e) {
        console.warn('Game result record failed:', e.message);
    }
}