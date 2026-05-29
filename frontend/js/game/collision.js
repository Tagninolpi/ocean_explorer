// ============================================================
// COLLISION DETECTION
// Uses SAT.js for polygon/circle collision
// ============================================================

// ============================================================
// BUILD SAT SHAPES FOR PLAYER
// Returns a SAT.Polygon representing the player's rotated rectangle
// ============================================================
function getPlayerSATBox() {
    const hw = player.dimensions.w / 2;
    const hh = player.dimensions.h / 2;

    const box = new SAT.Polygon(
        new SAT.Vector(player.px, player.py),
        [
            new SAT.Vector(-hw, -hh),
            new SAT.Vector( hw, -hh),
            new SAT.Vector( hw,  hh),
            new SAT.Vector(-hw,  hh),
        ]
    );
    box.setAngle(player.heading);
    return box;
}

// ============================================================
// PLAYER VS BIG ISLANDS
// Rotated rectangle vs polygon
// ============================================================
function checkPlayerIslandCollisions() {
    if (!player) {
        //console.log('checkPlayerIslandCollisions: player is null');
        return;
    }
    //console.log('Checking island collisions, player pos:', player.px, player.py);

    const playerBox = getPlayerSATBox();
    const response = new SAT.Response();

    for (const island of islandList) {
        response.clear();

        // Build SAT polygon for island
        const islandPoly = new SAT.Polygon(
            new SAT.Vector(0, 0),
            island.polygon.map(p => new SAT.Vector(p.x, p.y))
        );

        const collided = SAT.testPolygonPolygon(playerBox, islandPoly, response);

        if (collided) {
            resolveIslandCollision(response);
        }
    }
}

// ============================================================
// PLAYER VS SMALL OBSTACLES
// Rotated rectangle vs circle
// ============================================================
function checkPlayerObstacleCollisions() {
    if (!player) return;
    const playerBox = getPlayerSATBox();
    const response = new SAT.Response();

    // Only check obstacles near the player (within 3 tiles)
    const tileX = Math.floor(player.px / TILE_SIZE);
    const tileY = Math.floor(player.py / TILE_SIZE);
    const checkRadius = 3;

    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            const tx = tileX + dx;
            const ty = tileY + dy;
            if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) continue;

            const key = `${tx},${ty}`;
            const obstacle = obstacleStore[key];
            if (!obstacle) continue;

            response.clear();

            // Circle center in pixels (center of tile)
            const cx = tx * TILE_SIZE + TILE_SIZE / 2;
            const cy = ty * TILE_SIZE + TILE_SIZE / 2;
            const radiusPx = obstacle.radius * TILE_SIZE;

            const circle = new SAT.Circle(
                new SAT.Vector(cx, cy),
                radiusPx
            );

            const collided = SAT.testPolygonCircle(playerBox, circle, response);

            if (collided) {
                resolveObstacleCollision(obstacle, response);
            }
        }
    }
}

// ============================================================
// COLLISION RESOLUTION
// ============================================================
function resolveIslandCollision(response) {
    // Push player out using overlap vector
    player.px -= response.overlapV.x;
    player.py -= response.overlapV.y;

    if (Math.abs(player.currentSpeed) < 0.1) return; // no bounce if barely moving

    // Calculate surface normal (unit vector pointing away from collision)
    const nx = response.overlapV.x / response.overlap;
    const ny = response.overlapV.y / response.overlap;

    // Current velocity vector
    const vx = Math.sin(player.heading) * player.currentSpeed;
    const vy = -Math.cos(player.heading) * player.currentSpeed;

    // Dot product of velocity and normal = how direct the impact is
    const dot = vx * nx + vy * ny;
    
    // Impact angle factor: 1.0 = perpendicular (90°), 0.0 = parallel
    const impactAngle = Math.abs(dot) / Math.sqrt(vx*vx + vy*vy);

    // Reflect velocity: v' = v - 2(v·n)n
    const rvx = vx - 2 * dot * nx;
    const rvy = vy - 2 * dot * ny;

    // New heading from reflected velocity
    player.heading = Math.atan2(rvx, -rvy);

    // Speed reduction: 50% at 90°, 10% at grazing
    const speedRetention = 1 - (0.4 * impactAngle + 0.1);
    player.currentSpeed *= speedRetention;

    // Damage proportional to impact angle and speed
    const damage = Math.floor(impactAngle * Math.abs(player.currentSpeed) * 2);
    applyDamageToPlayer(damage);
}

function resolveObstacleCollision(obstacle, response) {
    switch (obstacle.type) {
        case 'rock':
            resolveIslandCollision(response); // same as island
            break;

        case 'iceberg':
            // Reveal true hitbox on first contact
            if (!obstacle.revealed) {
                obstacle.revealed = true;
                // TODO: update visual
            }
            resolveIslandCollision(response);
            break;

        case 'mine':
            // Apply damage, destroy mine, respawn
            applyDamageToPlayer(obstacle.damage);
            destroyMine(obstacle);
            break;

        case 'whirlpool':
            // Handled in updatePlayer as continuous pull, not a collision response
            break;
    }
}

// ============================================================
// MINE DESTRUCTION AND RESPAWN
// ============================================================
function destroyMine(obstacle) {
    const key = `${obstacle.x},${obstacle.y}`;
    mapGrid[obstacle.x][obstacle.y] = TILE.WATER;
    delete obstacleStore[key];

    // Respawn at random empty water tile
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
        attempts++;
        const x = randInt(0, MAP_SIZE - 1);
        const y = randInt(0, MAP_SIZE - 1);
        if (mapGrid[x][y] !== TILE.WATER) continue;
        mapGrid[x][y] = TILE.MINE;
        obstacleStore[`${x},${y}`] = {
            type: 'mine',
            x, y,
            ...OBSTACLE_DEFAULTS['mine']
        };
        placed = true;
    }
}

// ============================================================
// WHIRLPOOL — continuous pull applied in update
// ============================================================
function applyWhirlpoolEffects() {
    if (!player) return;
    const tileX = Math.floor(player.px / TILE_SIZE);
    const tileY = Math.floor(player.py / TILE_SIZE);
    const checkRadius = 3;

    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            const tx = tileX + dx;
            const ty = tileY + dy;
            if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) continue;

            const obstacle = obstacleStore[`${tx},${ty}`];
            if (!obstacle || obstacle.type !== 'whirlpool') continue;

            const cx = tx * TILE_SIZE + TILE_SIZE / 2;
            const cy = ty * TILE_SIZE + TILE_SIZE / 2;
            const radiusPx = obstacle.radius * TILE_SIZE;

            const distX = cx - player.px;
            const distY = cy - player.py;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist < radiusPx) {
                // Pull toward center, proportional to strength
                const pull = obstacle.strength * 0.05;
                player.px += (distX / dist) * pull;
                player.py += (distY / dist) * pull;

                // Slow player
                player.currentSpeed *= (1 - obstacle.strength * 0.02);
            }
        }
    }
}

// ============================================================
// DAMAGE
// ============================================================
function applyDamageToPlayer(amount) {
    if (amount <= 0) return;
    
    // Apply equipment damage modifiers (shields, damage reduction)
    const finalDamage = applyEquipmentDamageModifiers(amount);
    
    if (finalDamage <= 0) {
        console.log('Damage absorbed by equipment!');
        return;
    }

    player.hp = Math.max(0, player.hp - finalDamage);

    // Update HP bar
    const pct = player.hp / player.maxHp;
    document.getElementById('game-hp-bar').style.width = (pct * 100) + '%';
    document.getElementById('game-hp-numbers').textContent =
        Math.ceil(player.hp) + ' / ' + player.maxHp;

    // Color shift red as HP drops
    const r = Math.floor(255 * (1 - pct));
    const g = Math.floor(255 * pct);
    document.getElementById('game-hp-bar').style.background =
        `rgb(${r},${g},0)`;

    if (player.hp <= 0) {
        triggerGameOver();
    }
}

// ============================================================
// GAME OVER
// ============================================================
function triggerGameOver() {
    cancelAnimationFrame(animationId);
    animationId = null;
    alert('Game Over!'); // placeholder — replace with proper UI later
    showPage('page-main-menu');
}

// ============================================================
// HP REGEN
// ============================================================
let regenTimer = null;

function startRegenTimer() {
    if (regenTimer) clearInterval(regenTimer);
    regenTimer = setInterval(() => {
        if (!player) return;
        player.hp = Math.min(player.maxHp, player.hp + player.hpRegen);
        const pct = player.hp / player.maxHp;
        document.getElementById('game-hp-bar').style.width = (pct * 100) + '%';
        document.getElementById('game-hp-numbers').textContent =
            Math.ceil(player.hp) + ' / ' + player.maxHp;
        document.getElementById('game-hp-bar').style.background =
            `rgb(${Math.floor(255*(1-pct))},${Math.floor(255*pct)},0)`;
    }, 5000);
}

// ============================================================
// SCRAP COLLECTION
// Check if player is within reach of any scrap
// ============================================================
function checkScrapCollection() {
    if (!player) return;

    // Only check scrap near the player
    const tileX = Math.floor(player.px / TILE_SIZE);
    const tileY = Math.floor(player.py / TILE_SIZE);
    const checkRadius = Math.ceil(player.reach / TILE_SIZE) + 1;

    for (let i = scrapList.length - 1; i >= 0; i--) {
        const scrap = scrapList[i];
        
        // Skip if too far away (tile distance check first for speed)
        if (Math.abs(scrap.x - tileX) > checkRadius) continue;
        if (Math.abs(scrap.y - tileY) > checkRadius) continue;

        // Scrap position in pixels (center of tile)
        const scrapPx = {
            x: scrap.x * TILE_SIZE + TILE_SIZE / 2,
            y: scrap.y * TILE_SIZE + TILE_SIZE / 2,
        };

        // Distance check
        const dx = scrapPx.x - player.px;
        const dy = scrapPx.y - player.py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= player.reach) {
            collectScrap(scrap, i);
        }
    }
}

function collectScrap(scrap, index) {
    // Check cargo capacity
    if (inventory.cargoUsed >= inventory.cargoMax) {
        console.log('Cargo full! Cannot collect scrap.');
        return;
    }

    console.log('Collected scrap:', scrap.type, scrap.amount, 'rarity:', scrap.rarity);

    // Add to inventory via equipment system
    onScrapCollected(scrap);

    // Remove from map
    mapGrid[scrap.x][scrap.y] = TILE.INTERIOR;
    scrapList.splice(index, 1);

    // Spawn new scrap at random valid tile, min distance from player
    spawnNewScrap();
}

function spawnNewScrap() {
    // Collect all valid interior tiles far enough from player
    const minDistTiles = 10;
    const playerTileX = Math.floor(player.px / TILE_SIZE);
    const playerTileY = Math.floor(player.py / TILE_SIZE);

    const validTiles = [];
    for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
            if (mapGrid[x][y] !== TILE.INTERIOR) continue;
            
            const dx = x - playerTileX;
            const dy = y - playerTileY;
            if (Math.sqrt(dx*dx + dy*dy) < minDistTiles) continue;

            validTiles.push({ x, y });
        }
    }

    if (validTiles.length === 0) {
        console.warn('No valid tiles for scrap spawn');
        return;
    }

    const tile = validTiles[randInt(0, validTiles.length - 1)];
    const newScrap = generateScrapItem(tile.x, tile.y);
    scrapList.push(newScrap);
    mapGrid[tile.x][tile.y] = TILE.SCRAP;
}