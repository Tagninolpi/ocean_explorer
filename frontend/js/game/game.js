let gameState = null;
let animationId = null;

function initGame(boat) {
    const canvas = document.getElementById('game-canvas');

    function resizeCanvas() {
        const size = window.innerHeight;
        canvas.width = size;
        canvas.height = size;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate map
    generateMap();

    // Spawn player at random port
    const spawnIsland = islandList[randInt(0, islandList.length - 1)];
    const spawnTile = spawnIsland.port;
    const spawnPx = tileToPixel(spawnTile.x, spawnTile.y);

    // Init player
    initPlayer(boat, spawnPx);
    startRegenTimer();

    // Init equipment/inventory system
    initInventory(boat);

    gameState = {
        boat: boat,
        canvas: canvas,
        ctx: canvas.getContext('2d'),
    };

    // Populate UI
    document.getElementById('game-boat-name').textContent = boat.name;
    document.getElementById('game-hp-numbers').textContent = boat.maxHp + ' / ' + boat.maxHp;
    document.getElementById('stat-max-speed').textContent = boat.maxSpeedF;
    document.getElementById('stat-turn').textContent = boat.turnRatio;
    document.getElementById('stat-regen').textContent = boat.hpRegen + ' HP/5s';
    document.getElementById('stat-reach').textContent = boat.reach + 'px';
    document.getElementById('stat-zoom').textContent = '1.00';
    document.getElementById('stat-cargo').textContent = '0 / ' + boat.capacity;
    document.getElementById('stat-speed').textContent = '0';

    // Ability
    const abilitiesContainer = document.getElementById('game-abilities');
    abilitiesContainer.innerHTML = '<div class="game-abilities-title">Abilities</div>';
    const abilityBtn = document.createElement('div');
    abilityBtn.className = 'ability-btn';
    abilityBtn.textContent = boat.ability;
    abilitiesContainer.appendChild(abilityBtn);

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
}

function render() {
    const { ctx, canvas } = gameState;
    renderMap(ctx, canvas.width, { x: player.px, y: player.py }, player.zoom);
    renderPlayer(ctx, canvas.width);
}