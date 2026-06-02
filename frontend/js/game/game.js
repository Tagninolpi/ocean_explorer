let gameState = null;
let animationId = null;

function initGame(boat) {
    const canvas = document.getElementById('game-canvas');

    function resizeCanvas() {
        const size = Math.min(window.innerHeight, window.innerWidth);
        canvas.width = size;
        canvas.height = size;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate map
    generateMap();

    // Spawn player at random port
    const spawnIsland = islandList[randInt(0, islandList.length - 1)];
    const spawnTile   = spawnIsland.port;
    const spawnPx     = tileToPixel(spawnTile.x, spawnTile.y);

    // Init player
    initPlayer(boat, spawnPx);
    startRegenTimer();

    // Init inventory/equipment
    initInventory(boat);

    gameState = { boat, canvas, ctx: canvas.getContext('2d') };

    // Populate UI
    document.getElementById('game-boat-name').textContent   = boat.name;
    document.getElementById('game-hp-numbers').textContent  = boat.maxHp + ' / ' + boat.maxHp;
    document.getElementById('stat-max-speed').textContent   = boat.maxSpeedF;
    document.getElementById('stat-turn').textContent        = boat.turnRatio;
    document.getElementById('stat-regen').textContent       = boat.hpRegen + ' HP/5s';
    document.getElementById('stat-reach').textContent       = boat.reach + 'px';
    document.getElementById('stat-zoom').textContent        = '1.00';
    document.getElementById('stat-cargo').textContent       = '0 / ' + boat.capacity;
    document.getElementById('stat-speed').textContent       = '0';

    // Ability button
    const abilitiesContainer = document.getElementById('game-abilities');
    abilitiesContainer.innerHTML = '<div class="game-abilities-title">Abilities</div>';
    const abilityBtn = document.createElement('div');
    abilityBtn.className = 'ability-btn';
    abilityBtn.textContent = boat.ability;
    abilitiesContainer.appendChild(abilityBtn);

    // Key hints for active abilities
    const hints = document.createElement('div');
    hints.style.cssText = 'font-size:9px;color:#888;margin-top:4px;';
    hints.textContent = '[E]=Speed [D]=Blocker [Q]=Boat Ability [A/Z]=Zoom';
    abilitiesContainer.appendChild(hints);

    // Wave UI
    let waveEl = document.getElementById('game-wave');
    if (!waveEl) {
        waveEl = document.createElement('div');
        waveEl.id = 'game-wave';
        waveEl.style.cssText = 'position:absolute;top:8px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;font-weight:bold;pointer-events:none;';
        canvas.parentElement.appendChild(waveEl);
    }
    let waveTimerEl = document.getElementById('game-wave-timer');
    if (!waveTimerEl) {
        waveTimerEl = document.createElement('div');
        waveTimerEl.id = 'game-wave-timer';
        waveTimerEl.style.cssText = 'position:absolute;top:28px;left:50%;transform:translateX(-50%);color:#aaa;font-size:12px;pointer-events:none;';
        canvas.parentElement.appendChild(waveTimerEl);
    }

    // Start boat ability timers (fishing boat, surf boat, etc.)
    startBoatAbilityTimers();

    // Start wave system
    startWaves();

    // Start loop
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function gameLoop() {
    update();
    render();
    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    updatePlayer();
    if (typeof updateEnemies === 'function')        updateEnemies();
    if (typeof updatePlayerWeapons === 'function')  updatePlayerWeapons();
    if (typeof checkPlayerEnemyCollisions === 'function') checkPlayerEnemyCollisions();
    if (typeof checkMinesVsEnemies === 'function')  checkMinesVsEnemies();
    if (typeof applyBoatMovementAbilities === 'function') applyBoatMovementAbilities();
}

function render() {
    const { ctx, canvas } = gameState;
    const camPos = { x: player.px, y: player.py };
    renderMap(ctx, canvas.width, camPos, player.zoom);
    if (typeof renderEnemies === 'function') {
        renderEnemies(ctx, canvas.width, camPos, player.zoom);
    }
    renderPlayer(ctx, canvas.width);
    renderHUD(ctx, canvas.width);
}

// ============================================================
// HUD OVERLAY — wave counter, enemy count
// ============================================================
function renderHUD(ctx, size) {
    if (typeof enemyList === 'undefined') return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(size/2 - 70, 4, 140, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${typeof waveNumber !== 'undefined' ? waveNumber : 0}  |  Enemies: ${enemyList.length}`, size/2, 19);
    ctx.textAlign = 'left';
    ctx.restore();
}