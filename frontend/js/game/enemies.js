// ============================================================
// ENEMY SYSTEM
// Waves, spawning, steering, attacks, drops
// ============================================================

// ============================================================
// ENEMY STATE
// ============================================================
let enemyList  = [];   // active enemies
let waveNumber = 0;
let waveTimer  = null;
let waveTimeLeft = 0;
let waveTimerInterval = null;
let deployedMines = []; // from mine_launcher: { x, y, armed, expiresAt }
let grenadeZones  = []; // active grenade explosions to render

// ============================================================
// WAVE SYSTEM
// ============================================================
function startWaves() {
  waveNumber = 0;
  startNextWave();
}

let _waveStartPending = false;

function startNextWave() {
  _waveStartPending = false;
  waveNumber++;
  const budget = WAVE_BASE + (waveNumber - 1) * WAVE_SCALE;
  spawnWaveEnemies(budget);

  // Update wave UI
  const el = document.getElementById('game-wave');
  if (el) el.textContent = 'Wave ' + waveNumber;

  // 2-minute wave timer
  waveTimeLeft = WAVE_DURATION / 1000;
  if (waveTimerInterval) clearInterval(waveTimerInterval);
  waveTimerInterval = setInterval(() => {
    waveTimeLeft--;
    const el2 = document.getElementById('game-wave-timer');
    if (el2) el2.textContent = formatTime(waveTimeLeft);
    if (waveTimeLeft <= 0 && !_waveStartPending) {
      clearInterval(waveTimerInterval);
      waveTimerInterval = null;
      _waveStartPending = true;
      startNextWave();
    }
  }, 1000);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Check if all enemies are dead → start next wave early
function checkWaveCompletion() {
  if (enemyList.length === 0 && waveTimerInterval && !_waveStartPending) {
    clearInterval(waveTimerInterval);
    waveTimerInterval = null;
    _waveStartPending = true;
    setTimeout(startNextWave, 2000); // brief pause before next wave
  }
}

// ============================================================
// ENEMY SPAWNING
// ============================================================
function spawnWaveEnemies(budget) {
  enemyList = [];

  const allEnemies = [...ENEMIES];
  const highTier   = allEnemies.filter(e => e.pointValue >= allEnemies[Math.floor(allEnemies.length/2)].pointValue);
  const lowTier    = allEnemies.filter(e => e.pointValue < allEnemies[Math.floor(allEnemies.length/2)].pointValue);

  let remaining = budget;
  while (remaining > 0) {
    // 70% high tier, 30% low tier
    const pool = (Math.random() < 0.7 && highTier.length > 0) ? highTier : lowTier;
    const affordable = pool.filter(e => e.pointValue <= remaining);
    if (affordable.length === 0) break;

    const def = affordable[randInt(0, affordable.length - 1)];
    const spawnTile = findEnemySpawnTile();
    if (!spawnTile) break;

    const enemy = createEnemy(def, spawnTile);
    enemyList.push(enemy);
    remaining -= def.pointValue;
  }
}

function findEnemySpawnTile() {
  const playerTX = Math.floor(player.px / TILE_SIZE);
  const playerTY = Math.floor(player.py / TILE_SIZE);
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const x = randInt(0, MAP_SIZE - 1);
    const y = randInt(0, MAP_SIZE - 1);
    if (mapGrid[x][y] !== TILE.WATER) continue;
    const dx = x - playerTX, dy = y - playerTY;
    if (Math.sqrt(dx*dx+dy*dy) < ENEMY_SPAWN_MIN_DIST) continue;
    return { x, y };
  }
  return null;
}

function createEnemy(def, spawnTile) {
  const px = spawnTile.x * TILE_SIZE + TILE_SIZE / 2;
  const py = spawnTile.y * TILE_SIZE + TILE_SIZE / 2;

  // Build loadout: rarity-matching weapon + random fills
  const loadout = buildEnemyLoadout(def);

  return {
    id: def.id,
    name: def.name,
    rarity: def.rarity,
    speed: def.speed,
    maxHp: def.maxHp,
    hp: def.maxHp,
    hpRegen: def.hpRegen,
    dimensions: def.dimensions,
    px, py,
    heading: 0,
    loadout,
    // Combat state
    attackCooldowns: loadout.map(() => 0),
    // Steering state
    avoidTarget: null,      // obstacle being avoided
    avoidSide: 1,           // +1 or -1
    // Regen
    regenAccum: 0,
  };
}

function buildEnemyLoadout(def) {
  const weapons = EQUIPMENT.filter(e => e.class === 'Weapon');
  const specials = EQUIPMENT.filter(e => e.class !== 'Weapon');
  const slots = def.equipmentSlots;
  const loadout = [];

  // Slot 0: always a weapon matching enemy rarity (capped)
  const weapon = weapons[randInt(0, weapons.length - 1)];
  const weaponRarity = Math.min(def.rarity, Math.max(...weapon.rarities));
  const weaponRarityActual = weapon.rarities.includes(weaponRarity) ? weaponRarity : weapon.rarities[weapon.rarities.length - 1];
  const ws = getItemStats(weapon.id, weaponRarityActual);
  if (ws) {
    loadout.push({ equipmentId: weapon.id, rarity: weaponRarityActual });
  }

  // Remaining slots: random equipment up to enemy rarity
  for (let i = loadout.length; i < slots; i++) {
    const pool = specials.filter(e => e.rarities.some(r => r <= def.rarity));
    if (pool.length === 0) break;
    const eq  = pool[randInt(0, pool.length - 1)];
    const maxR = Math.min(def.rarity, Math.max(...eq.rarities));
    const r    = eq.rarities.includes(maxR) ? maxR : eq.rarities[0];
    loadout.push({ equipmentId: eq.id, rarity: r });
  }

  return loadout;
}

// ============================================================
// UPDATE ENEMIES (called every frame from game loop)
// ============================================================
function updateEnemies() {
  if (!player || enemyList.length === 0) return;

  const now = Date.now();

  for (let i = enemyList.length - 1; i >= 0; i--) {
    const e = enemyList[i];

    // Regen
    e.regenAccum = (e.regenAccum || 0) + 1;
    if (e.regenAccum >= 300) { // ~5s at 60fps
      e.hp = Math.min(e.maxHp, e.hp + e.hpRegen);
      e.regenAccum = 0;
    }

    // Determine target
    const targetPx = getEnemyTarget();

    // Steering
    steerEnemy(e, targetPx);

    // Attacks
    for (let s = 0; s < e.loadout.length; s++) {
      tryEnemyAttack(e, s, now);
    }

    // Mine launcher — deploy mines on tiles around enemy
    for (let s = 0; s < e.loadout.length; s++) {
      const item = e.loadout[s];
      if (item.equipmentId !== 'mine_launcher') continue;
      if (!item._nextDeploy) item._nextDeploy = now;
      if (now >= item._nextDeploy) {
        const stats = getItemStats('mine_launcher', item.rarity);
        deployEnemyMine(e, stats);
        item._nextDeploy = now + stats.deployInterval;
      }
    }
  }

  // Update deployed mines
  updateDeployedMines(now);

  // Update grenade zones (both player-owned and enemy)
  updateAllGrenadeZones(now);

  checkWaveCompletion();
}

function getEnemyTarget() {
  // Submarine ghost: all enemies target the ghost while active
  if (submarineGhost && submarineGhost.active) {
    return { x: submarineGhost.px, y: submarineGhost.py };
  }
  return { x: player.px, y: player.py };
}

// ============================================================
// ENEMY STEERING (circle-based obstacle avoidance)
// ============================================================
function steerEnemy(e, target) {
  const dx  = target.x - e.px;
  const dy  = target.y - e.py;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 1) return;

  // Desired direction to target
  let desiredAngle = Math.atan2(dx, -dy); // same convention as player (0=up)

  // Obstacle avoidance check
  const obstacle = findObstacleInPath(e);
  if (obstacle) {
    // Compute tangent angle
    const odx  = obstacle.cx - e.px;
    const ody  = obstacle.cy - e.py;
    const odist = Math.sqrt(odx*odx + ody*ody);
    const tangentAngle = Math.asin(Math.min(1, obstacle.r / odist));
    const toObstacleAngle = Math.atan2(odx, -ody);

    // Choose side closest to current heading
    const sideA = toObstacleAngle + tangentAngle + 0.2;
    const sideB = toObstacleAngle - tangentAngle - 0.2;
    const dA = angleDiff(e.heading, sideA);
    const dB = angleDiff(e.heading, sideB);
    desiredAngle = (Math.abs(dA) < Math.abs(dB)) ? sideA : sideB;
  }

  // Smoothly rotate toward desired angle
  const turnMax = 0.05;
  const diff    = angleDiff(e.heading, desiredAngle);
  e.heading    += Math.max(-turnMax, Math.min(turnMax, diff));

  // Slow down when within weapon attack range — orbit instead of ramming
  let moveSpeed = e.speed;
  const weaponRange = getEnemyWeaponRange(e);
  if (weaponRange > 0 && dist < weaponRange) {
    // Within attack range: reduce to 30% speed so they maintain distance
    moveSpeed = e.speed * 0.3;
  }

  // Move
  e.px += Math.sin(e.heading) * moveSpeed;
  e.py -= Math.cos(e.heading) * moveSpeed;

  // Clamp to map
  e.px = Math.max(0, Math.min(MAP_PIXEL_SIZE - 1, e.px));
  e.py = Math.max(0, Math.min(MAP_PIXEL_SIZE - 1, e.py));
}

// Returns the shortest weapon range among this enemy's weapons, or 0 if none
function getEnemyWeaponRange(e) {
  let range = 0;
  for (const item of e.loadout) {
    const eq = EQUIPMENT.find(eq => eq.id === item.equipmentId);
    if (!eq || eq.class !== 'Weapon') continue;
    const stats = getItemStats(item.equipmentId, item.rarity);
    if (stats && stats.range && (range === 0 || stats.range < range)) {
      range = stats.range;
    }
  }
  return range;
}

function angleDiff(a, b) {
  let d = b - a;
  while (d >  Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function findObstacleInPath(e) {
  const lookAhead = 120; // pixels look-ahead
  const exPx = e.px + Math.sin(e.heading) * lookAhead;
  const eyPy = e.py - Math.cos(e.heading) * lookAhead;

  // Check big islands (use radius)
  for (const island of islandList) {
    const cx = island.centerPx.x;
    const cy = island.centerPx.y;
    const r  = island.radius + 30;
    if (lineCircleIntersects(e.px, e.py, exPx, eyPy, cx, cy, r)) {
      return { cx, cy, r };
    }
  }

  // Check small obstacles near enemy
  const tileX = Math.floor(e.px / TILE_SIZE);
  const tileY = Math.floor(e.py / TILE_SIZE);
  const checkR = 4;
  for (let ddx = -checkR; ddx <= checkR; ddx++) {
    for (let ddy = -checkR; ddy <= checkR; ddy++) {
      const tx = tileX + ddx, ty = tileY + ddy;
      if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) continue;
      const obs = obstacleStore[`${tx},${ty}`];
      if (!obs || obs.type === 'mine' || obs.type === 'whirlpool') continue;
      const cx = tx * TILE_SIZE + TILE_SIZE / 2;
      const cy = ty * TILE_SIZE + TILE_SIZE / 2;
      const r  = obs.radius * TILE_SIZE + 10;
      if (lineCircleIntersects(e.px, e.py, exPx, eyPy, cx, cy, r)) {
        return { cx, cy, r };
      }
    }
  }
  return null;
}

// Segment–circle intersection test
function lineCircleIntersects(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1, dy = y2 - y1;
  const fx = x1 - cx, fy = y1 - cy;
  const a  = dx*dx + dy*dy;
  const b  = 2*(fx*dx + fy*dy);
  const c  = fx*fx + fy*fy - r*r;
  let disc = b*b - 4*a*c;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2*a);
  const t2 = (-b + disc) / (2*a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

// ============================================================
// ENEMY ATTACKS
// ============================================================
function tryEnemyAttack(enemy, slotIndex, now) {
  const item = enemy.loadout[slotIndex];
  if (!item) return;
  const eq = EQUIPMENT.find(e => e.id === item.equipmentId);
  if (!eq || eq.class !== 'Weapon') return;

  const stats = getItemStats(item.equipmentId, item.rarity);
  if (!stats) return;

  const cooldownEnd = enemy.attackCooldowns[slotIndex] || 0;
  if (now < cooldownEnd) return;

  const dx    = player.px - enemy.px;
  const dy    = player.py - enemy.py;
  const dist  = Math.sqrt(dx*dx + dy*dy);

  if (dist > stats.range) return;

  // Attack!
  switch (item.equipmentId) {
    case 'cannon':
      fireCannon(enemy, stats, dist);
      enemy.attackCooldowns[slotIndex] = now + stats.cooldown;
      break;

    case 'minigun':
      if (!item._minigunActive) {
        item._minigunActive = true;
        item._minigunEnd    = now + stats.duration;
        item._minigunInterval = setInterval(() => {
          if (!player || !enemy || enemy.hp <= 0) { clearInterval(item._minigunInterval); item._minigunActive = false; return; }
          const d2 = Math.hypot(player.px - enemy.px, player.py - enemy.py);
          if (d2 > stats.range) { clearInterval(item._minigunInterval); item._minigunActive = false; return; }
          applyDamageToPlayer(stats.damagePerTick);
        }, stats.tickRate);
        setTimeout(() => {
          clearInterval(item._minigunInterval);
          item._minigunActive = false;
          enemy.attackCooldowns[slotIndex] = Date.now() + stats.cooldown;
        }, stats.duration);
      }
      break;

    case 'grenade_launcher':
      fireGrenadeLauncher(enemy, stats);
      enemy.attackCooldowns[slotIndex] = now + stats.cooldown;
      break;

    // mine_launcher handled separately above
  }
}

function fireCannon(enemy, stats, dist) {
  // Instant hit — aircraft carrier passive: ignore if active
  if (gameState.boat.id === 'pirate_ship') return; // immune to cannon

  const damage = stats.damage;
  // Simple: direct damage if within range (no projectile travel)
  applyDamageToPlayer(damage);
  // Flash effect
  spawnHitEffect(player.px, player.py);
}

function fireGrenadeLauncher(enemy, stats) {
  const angle  = Math.atan2(player.px - enemy.px, -(player.py - enemy.py));
  const offset = (Math.random() - 0.5) * stats.radius;
  const targetX = player.px + Math.cos(angle) * offset;
  const targetY = player.py + Math.sin(angle) * offset;

  grenadeZones.push({
    x: targetX,
    y: targetY,
    radius: stats.radius,
    damage: stats.damage,
    expiresAt: Date.now() + stats.fuseTime,
    exploded: false,
  });
}

function updateGrenadeZones(now) {
  for (let i = grenadeZones.length - 1; i >= 0; i--) {
    const gz = grenadeZones[i];
    if (now >= gz.expiresAt && !gz.exploded) {
      gz.exploded = true;
      // Check if player in zone
      const d = Math.hypot(player.px - gz.x, player.py - gz.y);
      if (d <= gz.radius) {
        applyDamageToPlayer(gz.damage);
      }
      // Check if submarine ghost in zone
      if (submarineGhost && submarineGhost.active) {
        const dg = Math.hypot(submarineGhost.px - gz.x, submarineGhost.py - gz.y);
        if (dg <= gz.radius) submarineGhost.hp -= gz.damage;
      }
      grenadeZones.splice(i, 1);
    }
  }
}

// ============================================================
// DEPLOYED MINES (from enemy mine launchers)
// ============================================================
function deployEnemyMine(enemy, stats) {
  // Find nearest free tile
  const tx = Math.floor(enemy.px / TILE_SIZE);
  const ty = Math.floor(enemy.py / TILE_SIZE);
  for (let r = 1; r <= 3; r++) {
    for (let ddx = -r; ddx <= r; ddx++) {
      for (let ddy = -r; ddy <= r; ddy++) {
        const nx = tx + ddx, ny = ty + ddy;
        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue;
        if (mapGrid[nx][ny] !== TILE.WATER) continue;
        deployedMines.push({
          x: nx, y: ny,
          damage: stats.damage,
          armedAt: Date.now() + stats.armDelay,
          expiresAt: Date.now() + stats.lifetime,
        });
        mapGrid[nx][ny] = TILE.MINE;
        obstacleStore[`${nx},${ny}`] = { type: 'mine', x: nx, y: ny, radius: 0.8, damage: stats.damage, playerDeployed: false };
        return;
      }
    }
  }
}

function updateDeployedMines(now) {
  for (let i = deployedMines.length - 1; i >= 0; i--) {
    const m = deployedMines[i];
    if (now >= m.expiresAt) {
      mapGrid[m.x][m.y] = TILE.WATER;
      delete obstacleStore[`${m.x},${m.y}`];
      deployedMines.splice(i, 1);
    }
  }
}

// ============================================================
// APPLY DAMAGE TO ENEMY
// ============================================================
function applyDamageToEnemy(enemy, amount) {
  enemy.hp -= amount;
  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

// ============================================================
// ENEMY DEATH & DROPS
// ============================================================
function killEnemy(enemy) {
  const index = enemyList.indexOf(enemy);
  if (index !== -1) enemyList.splice(index, 1);

  // Spawn drop
  const dropTile = findNearestFreeTile(
    Math.floor(enemy.px / TILE_SIZE),
    Math.floor(enemy.py / TILE_SIZE)
  );
  if (!dropTile) return;

  // Aircraft carrier: always equipment drop
  const alwaysEquipment = gameState.boat.id === 'aircraft_carrier';

  if (!alwaysEquipment && Math.random() < 0.9) {
    // Scrap drop
    const scrap = generateScrapItemAtRarity(dropTile.x, dropTile.y, enemy.rarity);
    scrapList.push(scrap);
    mapGrid[dropTile.x][dropTile.y] = TILE.SCRAP;
  } else {
    // Equipment drop from loadout
    if (enemy.loadout.length > 0) {
      const dropped = enemy.loadout[randInt(0, enemy.loadout.length - 1)];
      spawnEquipmentDrop(dropTile, dropped, enemy.rarity);
    }
  }

  // Self-destruct timer for drops is handled in scrapList age or separate drop list
}

function generateScrapItemAtRarity(x, y, rarity) {
  // Generate with fixed rarity instead of rolling
  const typeRoll = Math.random();
  let type, amount;

  if (typeRoll < 0.5) {
    type = 'gold';
    const [mn, mx] = GOLD_RANGES[rarity - 1];
    amount = randInt(mn, mx);
  } else {
    type = typeRoll < 0.75 ? 'boat_part' : 'ability_part';
    let partRarity, amountRarity;
    if (rarity === 1) {
      partRarity = 1; amountRarity = 1;
    } else {
      partRarity   = Math.min(3, Math.max(1, randInt(1, rarity - 1)));
      amountRarity = Math.min(3, Math.max(1, rarity - partRarity));
    }
    const [mn, mx] = PART_AMOUNT_RANGES[amountRarity - 1];
    amount = randInt(mn, mx);
  }

  return { x, y, rarity, type, amount, _expireAt: Date.now() + 60000 };
}

function spawnEquipmentDrop(tile, item, rarity) {
  // Store as a special scrap-type entry with equipment payload
  scrapList.push({
    x: tile.x,
    y: tile.y,
    rarity,
    type: 'equipment_drop',
    equipmentId: item.equipmentId,
    equipRarity: item.rarity,
    amount: 1,
    _expireAt: Date.now() + 60000,
  });
  mapGrid[tile.x][tile.y] = TILE.SCRAP;
}

function findNearestFreeTile(tx, ty) {
  for (let r = 0; r <= 5; r++) {
    for (let ddx = -r; ddx <= r; ddx++) {
      for (let ddy = -r; ddy <= r; ddy++) {
        const nx = tx + ddx, ny = ty + ddy;
        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue;
        if (mapGrid[nx][ny] === TILE.WATER || mapGrid[nx][ny] === TILE.INTERIOR) {
          return { x: nx, y: ny };
        }
      }
    }
  }
  return null;
}

// ============================================================
// PLAYER vs ENEMY COLLISION (SAT)
// Called from collision.js update
// ============================================================
function checkPlayerEnemyCollisions() {
  if (!player) return;
  const playerBox = getPlayerSATBox();
  const response  = new SAT.Response();
  const now = Date.now();
  const COLLISION_COOLDOWN = 1500; // ms between collision damage hits per enemy

  for (const enemy of enemyList) {
    response.clear();
    const hw = enemy.dimensions.w / 2;
    const hh = enemy.dimensions.h / 2;
    const enemyBox = new SAT.Polygon(
      new SAT.Vector(enemy.px, enemy.py),
      [
        new SAT.Vector(-hw, -hh),
        new SAT.Vector( hw, -hh),
        new SAT.Vector( hw,  hh),
        new SAT.Vector(-hw,  hh),
      ]
    );
    enemyBox.setAngle(enemy.heading);

    if (SAT.testPolygonPolygon(playerBox, enemyBox, response)) {
      // Push apart every frame (physics)
      player.px -= response.overlapV.x * 0.5;
      player.py -= response.overlapV.y * 0.5;
      enemy.px  += response.overlapV.x * 0.5;
      enemy.py  += response.overlapV.y * 0.5;

      // Damage only once per cooldown window per enemy
      if (!enemy._collisionCooldownEnd || now >= enemy._collisionCooldownEnd) {
        const rammingDmg = Math.max(5, Math.floor(Math.abs(player.currentSpeed) * 3));
        applyDamageToPlayer(rammingDmg);
        applyDamageToEnemy(enemy, rammingDmg);
        enemy._collisionCooldownEnd = now + COLLISION_COOLDOWN;
      }
    }
  }
}

// ============================================================
// PLAYER WEAPONS — fire at nearest enemy
// Called from updatePlayer each frame
// ============================================================
function updatePlayerWeapons() {
  if (!player || enemyList.length === 0) return;
  const now  = Date.now();
  const weapons = getEquippedWeapons();

  for (let wi = 0; wi < weapons.length; wi++) {
    const item = weapons[wi];
    if (!item) continue;
    if (!item._cooldownEnd) item._cooldownEnd = 0;
    if (now < item._cooldownEnd) continue;

    const stats = getItemStats(item.equipmentId, item.rarity);
    if (!stats) continue;

    const target = findNearestEnemy(stats.range);
    if (!target) continue;

    switch (item.equipmentId) {
      case 'cannon':
        applyDamageToEnemy(target, stats.damage);
        spawnHitEffect(target.px, target.py);
        item._cooldownEnd = now + stats.cooldown;
        break;

      case 'minigun':
        if (!item._minigunActive) {
          item._minigunActive = true;
          item._minigunEnd    = now + stats.duration;
          item._minigunInterval = setInterval(() => {
            if (!player) { clearInterval(item._minigunInterval); item._minigunActive = false; return; }
            const nearest = findNearestEnemy(stats.range);
            if (!nearest) { clearInterval(item._minigunInterval); item._minigunActive = false; return; }
            applyDamageToEnemy(nearest, stats.damagePerTick);
          }, stats.tickRate);
          setTimeout(() => {
            clearInterval(item._minigunInterval);
            item._minigunActive = false;
            item._cooldownEnd = Date.now() + stats.cooldown;
          }, stats.duration);
        }
        break;

      case 'mine_launcher':
        if (!item._nextDeploy) item._nextDeploy = 0;
        if (now >= item._nextDeploy) {
          deployPlayerMine(stats);
          item._nextDeploy = now + stats.deployInterval;
        }
        break;

      case 'grenade_launcher':
        firePlayerGrenade(target, stats);
        item._cooldownEnd = now + stats.cooldown;
        break;
    }
  }
}

function findNearestEnemy(maxRange) {
  let nearest = null;
  let nearestDist = maxRange + 1;
  for (const e of enemyList) {
    const d = Math.hypot(e.px - player.px, e.py - player.py);
    if (d < nearestDist) { nearestDist = d; nearest = e; }
  }
  return nearest;
}

function deployPlayerMine(stats) {
  const tx = Math.floor(player.px / TILE_SIZE);
  const ty = Math.floor(player.py / TILE_SIZE);
  for (let r = 1; r <= 3; r++) {
    for (let ddx = -r; ddx <= r; ddx++) {
      for (let ddy = -r; ddy <= r; ddy++) {
        const nx = tx + ddx, ny = ty + ddy;
        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue;
        if (mapGrid[nx][ny] !== TILE.WATER) continue;
        deployedMines.push({
          x: nx, y: ny,
          damage: stats.damage,
          armedAt: Date.now() + stats.armDelay,
          expiresAt: Date.now() + stats.lifetime,
          playerOwned: true,
        });
        mapGrid[nx][ny] = TILE.MINE;
        obstacleStore[`${nx},${ny}`] = { type: 'mine', x: nx, y: ny, radius: 0.8, damage: stats.damage, playerOwned: true };
        return;
      }
    }
  }
}

function firePlayerGrenade(target, stats) {
  const offsetX = (Math.random() - 0.5) * stats.radius;
  const offsetY = (Math.random() - 0.5) * stats.radius;
  grenadeZones.push({
    x: target.px + offsetX,
    y: target.py + offsetY,
    radius: stats.radius,
    damage: stats.damage,
    expiresAt: Date.now() + stats.fuseTime,
    exploded: false,
    playerOwned: true,
  });
}

// Override grenade zone update to also hit enemies when player-owned
function updateGrenadeZonesPlayer(now) {
  for (let i = grenadeZones.length - 1; i >= 0; i--) {
    const gz = grenadeZones[i];
    if (!gz.exploded && now >= gz.expiresAt) {
      gz.exploded = true;
      if (gz.playerOwned) {
        // Damage all enemies in radius
        for (const e of enemyList) {
          const d = Math.hypot(e.px - gz.x, e.py - gz.y);
          if (d <= gz.radius) applyDamageToEnemy(e, gz.damage);
        }
      } else {
        // Damage player
        const d = Math.hypot(player.px - gz.x, player.py - gz.y);
        if (d <= gz.radius) applyDamageToPlayer(gz.damage);
      }
      grenadeZones.splice(i, 1);
    }
  }
}

// Replace the simple update with the full one
function updateAllGrenadeZones(now) {
  updateGrenadeZonesPlayer(now);
}

// ============================================================
// HIT EFFECT (visual flash — simple)
// ============================================================
let hitEffects = []; // {px, py, expiresAt}
function spawnHitEffect(px, py) {
  hitEffects.push({ px, py, expiresAt: Date.now() + 200 });
}

// ============================================================
// RENDER ENEMIES + EFFECTS
// ============================================================
function renderEnemies(ctx, canvasSize, playerPx, zoom) {
  if (!player) return;
  const half = canvasSize / 2;
  const now  = Date.now();

  for (const e of enemyList) {
    const sx = half + (e.px - playerPx.x) * zoom;
    const sy = half + (e.py - playerPx.y) * zoom;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(e.heading);

    // Hull
    ctx.fillStyle = rarityColor(e.rarity);
    const w = e.dimensions.w * zoom;
    const h = e.dimensions.h * zoom;
    ctx.fillRect(-w/2, -h/2, w, h);

    // Direction dot
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-3, -h/2 - 5, 6, 6);

    // HP bar
    ctx.restore();
    ctx.save();
    ctx.translate(sx, sy);
    const barW = e.dimensions.w * zoom * 1.2;
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(-barW/2, -e.dimensions.h/2 * zoom - 10, barW, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
    ctx.fillRect(-barW/2, -e.dimensions.h/2 * zoom - 10, barW * hpPct, 4);
    ctx.restore();
  }

  // Grenade zones (red circles with countdown)
  for (const gz of grenadeZones) {
    if (gz.exploded) continue;
    const sx2 = half + (gz.x - playerPx.x) * zoom;
    const sy2 = half + (gz.y - playerPx.y) * zoom;
    const r   = gz.radius * zoom;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,50,50,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(sx2, sy2, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Hit effects
  for (let i = hitEffects.length - 1; i >= 0; i--) {
    const fx = hitEffects[i];
    if (now > fx.expiresAt) { hitEffects.splice(i, 1); continue; }
    const sx3 = half + (fx.px - playerPx.x) * zoom;
    const sy3 = half + (fx.py - playerPx.y) * zoom;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx3, sy3, 8 * zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Submarine ghost
  if (submarineGhost && submarineGhost.active) {
    const sx4 = half + (submarineGhost.px - playerPx.x) * zoom;
    const sy4 = half + (submarineGhost.py - playerPx.y) * zoom;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(sx4 - 10, sy4 - 20, 20, 40);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

function rarityColor(r) {
  const colors = ['#aaaaaa','#44aa44','#4488ff','#aa44ff','#ffaa00'];
  return colors[Math.min(r - 1, 4)];
}

// ============================================================
// MINE DETONATION CHECK (for player-owned mines hitting enemies)
// Called from checkPlayerObstacleCollisions in collision.js already
// handles player hitting mines; here we check enemies
// ============================================================
function checkMinesVsEnemies() {
  const now = Date.now();
  for (let i = deployedMines.length - 1; i >= 0; i--) {
    const m = deployedMines[i];
    if (now < m.armedAt) continue; // not armed yet
    if (!m.playerOwned) continue;  // only player mines hurt enemies

    const mx = m.x * TILE_SIZE + TILE_SIZE / 2;
    const my = m.y * TILE_SIZE + TILE_SIZE / 2;
    const rPx = 0.8 * TILE_SIZE;

    for (let j = enemyList.length - 1; j >= 0; j--) {
      const e = enemyList[j];
      const d = Math.hypot(e.px - mx, e.py - my);
      if (d <= rPx + e.dimensions.w / 2) {
        applyDamageToEnemy(e, m.damage);
        // Destroy mine
        mapGrid[m.x][m.y] = TILE.WATER;
        delete obstacleStore[`${m.x},${m.y}`];
        deployedMines.splice(i, 1);
        break;
      }
    }
  }
}