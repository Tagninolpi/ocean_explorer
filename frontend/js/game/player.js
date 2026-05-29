// ============================================================
// PLAYER STATE
// ============================================================
let player = null;

function initPlayer(boat, spawnPx) {
    player = {
        // Position in map pixels
        px: spawnPx.x,
        py: spawnPx.y,
        // Movement
        heading: 0,          // radians, 0 = facing up
        currentSpeed: 0,
        currentTurn: 0,
        // Stats from boat
        maxSpeedF:   boat.maxSpeedF,
        maxSpeedB:   boat.maxSpeedB,
        accelF:      boat.accelF,
        accelB:      boat.accelB,
        turnRatio:   boat.turnRatio,
        decayFactor: boat.decayFactor,
        maxHp:       boat.maxHp,
        hp:          boat.maxHp,
        hpRegen:     boat.hpRegen,
        reach:       boat.reach,
        capacity:    boat.capacity,
        dimensions:  boat.dimensions,
        // Zoom
        zoom:        1,                      // start at max zoom in
        zoomMin:     boat.zoom,              // max zoom out (0.X per boat)
        zoomMax:     1,                      // max zoom in (same for all)
        zoomStep:    (1 - boat.zoom) / 4,   // 5 steps, always positive
        zoomCooldown: false,
    };
}

// ============================================================
// INPUT STATE
// ============================================================
const keys = {};

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    handleZoomInput(e.key);
});

document.addEventListener('keyup', e => {
    keys[e.key] = false;
});

// ============================================================
// ZOOM
// ============================================================
function handleZoomInput(key) {
    if (!player) return;
    if (player.zoomCooldown) return;

    if (key === 'a' || key === 'A') {
        // Zoom in (toward 1)
        player.zoom = Math.min(player.zoomMax, player.zoom + player.zoomStep);
        triggerZoomCooldown();
    } else if (key === 'z' || key === 'Z') {
        // Zoom out (toward boat.zoom min)
        player.zoom = Math.max(player.zoomMin, player.zoom - player.zoomStep);
        triggerZoomCooldown();
    }
}

function triggerZoomCooldown() {
    player.zoomCooldown = true;
    setTimeout(() => { player.zoomCooldown = false; }, 200);
}

// ============================================================
// UPDATE — called every frame
// ============================================================
function updatePlayer() {
    if (!player) {
        //console.log('updatePlayer called but player is null');
        return;
    }

    if (!updatePlayer.hasRun) {
        //console.log('First updatePlayer frame, player:', player);
        updatePlayer.hasRun = true;
    }

    // --- ACCELERATION ---
    if (keys['ArrowUp']) {
        player.currentSpeed += player.accelF;
        if (player.currentSpeed > player.maxSpeedF)
            player.currentSpeed = player.maxSpeedF;
    }
    if (keys['ArrowDown']) {
        player.currentSpeed -= player.accelB;
        if (player.currentSpeed < -player.maxSpeedB)
            player.currentSpeed = -player.maxSpeedB;
    }

    // --- TURNING ---
    // Turn amount reduces speed proportionally
    const turnSpeedPenalty = Math.abs(player.currentTurn) / player.turnRatio;

    if (keys['ArrowLeft']) {
        player.currentTurn -= player.turnRatio * 0.05;
        if (player.currentTurn < -player.turnRatio)
            player.currentTurn = -player.turnRatio;
    }
    if (keys['ArrowRight']) {
        player.currentTurn += player.turnRatio * 0.05;
        if (player.currentTurn > player.turnRatio)
            player.currentTurn = player.turnRatio;
    }

    // --- DECAY ---
    player.currentSpeed *= player.decayFactor;
    player.currentTurn  *= player.decayFactor;

    // Snap to zero to avoid infinite tiny values
    if (Math.abs(player.currentSpeed) < 0.01) player.currentSpeed = 0;
    if (Math.abs(player.currentTurn)  < 0.01) player.currentTurn  = 0;

    // --- HEADING ---
    player.heading += player.currentTurn * 0.02;

    // --- EFFECTIVE SPEED (turn bleeds speed) ---
    const effectiveSpeed = player.currentSpeed * (1 - turnSpeedPenalty * 0.3);

    // --- MOVE ---
    player.px += Math.sin(player.heading) * effectiveSpeed;
    player.py -= Math.cos(player.heading) * effectiveSpeed;

    // --- COLLISION ---
    checkPlayerIslandCollisions();
    checkPlayerObstacleCollisions();
    applyWhirlpoolEffects();

    // --- SCRAP COLLECTION ---
    checkScrapCollection();

    // --- UPDATE UI ---
    document.getElementById('stat-speed').textContent =
        Math.abs(player.currentSpeed).toFixed(1);
    document.getElementById('stat-zoom').textContent =
        player.zoom.toFixed(2);

    
}

// ============================================================
// RENDER PLAYER
// Player is always drawn at center of canvas, only heading changes
// ============================================================
function renderPlayer(ctx, canvasSize) {
    if (!player) return;

    const cx = canvasSize / 2;
    const cy = canvasSize / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(player.heading);

    // Placeholder boat rectangle
    const w = player.dimensions.w * player.zoom;
    const h = player.dimensions.h * player.zoom;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Direction indicator (front of boat)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-4, -h / 2 - 6, 8, 8);

    ctx.restore();
}