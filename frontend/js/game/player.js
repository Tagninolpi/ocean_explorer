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
// ZOOM — full version with ability keys defined below
// ============================================================
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
// ============================================================
// BOAT ABILITY MOVEMENT EFFECTS
// ============================================================
function applyBoatMovementAbilities() {
    if (!player || !gameState) return;
    const boatId = gameState.boat.id;
    const boat   = gameState.boat;

    // Tanker: max speed scales with cargo fill
    if (boatId === 'tanker') {
        const fillRatio = inventory.cargoUsed / Math.max(1, inventory.cargoMax);
        player.maxSpeedF = boat.maxSpeedF * (1 + fillRatio);
    }

    // Sailing Boat: max HP scales with cargo fill
    if (boatId === 'sailing_boat') {
        const fillRatio = inventory.cargoUsed / Math.max(1, inventory.cargoMax);
        player.maxHp = Math.floor(boat.maxHp * (1 + fillRatio));
    }

    // Ferry: max speed inversely proportional to HP
    if (boatId === 'ferry') {
        const hpRatio = player.hp / player.maxHp;
        player.maxSpeedF = boat.maxSpeedF * (2 - hpRatio);
    }

    // Windsurfer: turning increases speed instead of reducing it
    if (boatId === 'windsurfer' && Math.abs(player.currentTurn) > 0.001) {
        const turnBoost = Math.abs(player.currentTurn) * 0.5;
        player.currentSpeed = Math.min(player.maxSpeedF, player.currentSpeed + turnBoost * 0.02);
    }

    // Raft: speed boost inside whirlpool (override the normal slow)
    if (boatId === 'raft') {
        player._raftInWhirlpool = false; // reset each frame; applyWhirlpoolEffects sets it
    }
}

// Override zoom update to use dynamic zoom step
function handleZoomInput(key) {
    if (!player) return;
    if (player.zoomCooldown) return;

    if (key === 'a' || key === 'A') {
        player.zoom = Math.min(player.zoomMax, player.zoom + player.zoomStep);
        triggerZoomCooldown();
    } else if (key === 'z' || key === 'Z') {
        player.zoom = Math.max(player.zoomMin, player.zoom - player.zoomStep);
        triggerZoomCooldown();
    }
    // Coast Guard heal
    else if ((key === 'q' || key === 'Q') && gameState && gameState.boat.id === 'coast_guard') {
        activateAbility('coast_guard_heal');
    }
    // Submarine ghost
    else if ((key === 'q' || key === 'Q') && gameState && gameState.boat.id === 'submarine') {
        activateAbility('submarine_ghost');
    }
    // Active equipment: e = short speed boost, d = damage blocker
    else if (key === 'e' || key === 'E') {
        const item = inventory.equipped.find(i => i && i.equipmentId === 'short_speed_boost');
        if (item) activateAbility('short_speed_boost');
    }
    else if (key === 'd' || key === 'D') {
        const item = inventory.equipped.find(i => i && i.equipmentId === 'damage_blocker');
        if (item) activateAbility('damage_blocker');
    }
}

// Brigantine: mine collision override
function brigantineMineCollision(obstacle) {
    if (!gameState || gameState.boat.id !== 'brigantine') return false;
    // Destroy mine, no damage, spawn a new player-friendly mine
    const key = `${obstacle.x},${obstacle.y}`;
    mapGrid[obstacle.x][obstacle.y] = TILE.WATER;
    delete obstacleStore[key];
    // Spawn new mine at that position that damages only enemies
    deployedMines.push({
        x: obstacle.x, y: obstacle.y,
        damage: OBSTACLE_DEFAULTS['mine'].damage,
        armedAt: Date.now() + 3000,
        expiresAt: Date.now() + 120000,
        playerOwned: true,
    });
    mapGrid[obstacle.x][obstacle.y] = TILE.MINE;
    obstacleStore[key] = { type: 'mine', x: obstacle.x, y: obstacle.y, radius: 0.8, damage: OBSTACLE_DEFAULTS['mine'].damage, playerOwned: true };
    return true;
}

// Titanic: iceberg immunity
function titanicIcebergContact(obstacle) {
    if (!gameState || gameState.boat.id !== 'titanic') return false;
    // Double speed, ignore all effects
    player.currentSpeed = Math.min(player.maxSpeedF, Math.abs(player.currentSpeed) * 2);
    // Remove the obstacle
    const key = `${obstacle.x},${obstacle.y}`;
    mapGrid[obstacle.x][obstacle.y] = TILE.WATER;
    delete obstacleStore[key];
    return true;
}

// Destroyer: no damage/speed loss from island/iceberg
function destroyerCollisionImmune() {
    return gameState && gameState.boat.id === 'destroyer';
}