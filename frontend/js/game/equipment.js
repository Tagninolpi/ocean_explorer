// ============================================================
// EQUIPMENT & INVENTORY SYSTEM
// ============================================================

// ============================================================
// INVENTORY STATE
// ============================================================
let inventory = {
  equipped:  [],      // array length = equipmentSlots, each null or item object
  cargoUsed: 0,
  cargoMax:  0,

  // Active runtime state for equipment effects
  activeEffects: {
    damageBlockerUntil:    0,
    shortSpeedBoostUntil:  0,
    shortSpeedActive:      false,
    shortSpeedCooldownEnd: 0,
    damageBlockerCooldownEnd: 0,
  },
  timers: {}, // keyed by slot index for interval-based effects
};

// ============================================================
// CARGO (separate list — scrap, gold, parts; NOT equipped items)
// ============================================================
let cargoList = []; // { type, name, amount, rarity, equipmentId? }

// ============================================================
// INIT
// ============================================================
function initInventory(boat) {
  inventory.equipped  = Array(boat.equipmentSlots).fill(null);
  inventory.cargoUsed = 0;
  inventory.cargoMax  = boat.capacity;
  inventory.activeEffects = {
    damageBlockerUntil:    0,
    shortSpeedBoostUntil:  0,
    shortSpeedActive:      false,
    shortSpeedCooldownEnd: 0,
    damageBlockerCooldownEnd: 0,
  };
  // Clear any old timers
  Object.values(inventory.timers).forEach(t => clearInterval(t));
  inventory.timers = {};
  cargoList = [];

  // All boats start with a default R1 cannon (except inflatable_boat which has its built-in minigun)
  if (boat.id !== 'inflatable_boat') {
    inventory.equipped[0] = makeItem('cannon', 1, false);
    applyStatBonus(inventory.equipped[0]);
  }

  // Inflatable boat gets permanent built-in minigun
  if (boat.id === 'inflatable_boat') {
    inventory.equipped[0] = makeItem('minigun', 1, true);
    applyStatBonus(inventory.equipped[0]);
  }

  renderEquipmentUI();
  renderCargoUI();
  updateCargoCounter();
}

// ============================================================
// ITEM FACTORY
// ============================================================
function makeItem(equipmentId, rarity, permanent = false) {
  return { equipmentId, rarity, permanent, instanceId: Date.now() + Math.random() };
}

// ============================================================
// AUTO-EQUIP COLLECTED EQUIPMENT
// On scrap collect, if it's equipment, auto-mount in random free slot
// ============================================================
function tryAutoEquipItem(equipmentId, rarity) {
  // Find a free slot
  const freeSlot = inventory.equipped.findIndex(s => s === null);
  if (freeSlot === -1) {
    // No slot — cannot collect
    return false;
  }

  const stats = getItemStats(equipmentId, rarity);
  if (!stats) return false;

  // Check container ship capacity reduction
  const cargoNeeded = computeCargoSpace(equipmentId, rarity);
  if (inventory.cargoUsed + cargoNeeded > inventory.cargoMax) {
    return false; // not enough cargo
  }

  const item = makeItem(equipmentId, rarity);
  inventory.equipped[freeSlot] = item;
  inventory.cargoUsed += cargoNeeded;

  applyStatBonus(item);
  startItemTimers(item, freeSlot);

  renderEquipmentUI();
  updateCargoCounter();
  return true;
}

// ============================================================
// DISCARD EQUIPPED ITEM (free slot, give small gold)
// ============================================================
function discardEquippedItem(slotIndex) {
  const item = inventory.equipped[slotIndex];
  if (!item) return;
  if (item.permanent) { showToast('Cannot discard built-in equipment!'); return; }

  // Double Slot: discarding destroys all items in the linked slots
  if (item.equipmentId === 'double_slot') {
    // Remove extra slots added by this item
    const stats = getItemStats('double_slot', item.rarity);
    const extraStart = boat_equipmentSlots_base(); // original slot count
    // Just remove the last N slots
    for (let i = inventory.equipped.length - 1; i >= extraStart; i--) {
      if (inventory.equipped[i]) {
        removeItemEffects(inventory.equipped[i], i);
      }
      inventory.equipped.splice(i, 1);
    }
  }

  removeItemEffects(item, slotIndex);
  inventory.equipped[slotIndex] = null;
  inventory.cargoUsed -= computeCargoSpace(item.equipmentId, item.rarity);
  inventory.cargoUsed = Math.max(0, inventory.cargoUsed);

  // Give small gold reward
  const goldReward = Math.floor(10 * item.rarity);
  addToCargo({ type: 'gold', name: 'Gold', amount: goldReward });

  recalculateAllStats();
  renderEquipmentUI();
  updateCargoCounter();
  showToast(`Discarded for ${goldReward} gold`);
}

function boat_equipmentSlots_base() {
  if (!gameState) return inventory.equipped.length;
  return gameState.boat.equipmentSlots;
}

// ============================================================
// CARGO: add item (stackable for gold/parts)
// ============================================================
function addToCargo(item) {
  if (item.type === 'gold' || item.type === 'boat_part' || item.type === 'ability_part') {
    const existing = cargoList.find(c => c.type === item.type && c.rarity === item.rarity);
    if (existing) {
      existing.amount += item.amount;
      // already occupying 1 slot — no additional cargoUsed increment
    } else {
      cargoList.push({ ...item });
      inventory.cargoUsed += 1; // each distinct stack takes 1 cargo slot
    }
  } else {
    cargoList.push({ ...item });
    inventory.cargoUsed += 1;
  }
  renderCargoUI();
  updateCargoCounter();
}

// ============================================================
// ON SCRAP COLLECTED (called from collision.js)
// ============================================================
function onScrapCollected(scrap) {
  if (!player) return;

  // Apply boat ability modifiers
  let amount = scrap.amount;
  let type   = scrap.type;
  const boatId = gameState.boat.id;

  // Filter abilities
  if (boatId === 'small_raft'      && type !== 'gold')         return;
  if (boatId === 'swimming_vest'   && type !== 'boat_part')    return;
  if (boatId === 'inflatable_plank'&& type !== 'ability_part') return;

  // Gold doublers
  if (type === 'gold') {
    if (boatId === 'caravel')    amount *= 2;
    if (boatId === 'barge')      amount = Math.floor(amount * 1.5);
  }

  // Rarity shift for Container Ship (Small)
  let rarity = scrap.rarity;
  if (boatId === 'container_ship_small') {
    rarity = Math.min(5, rarity + 1);
    // Re-roll amount with new rarity if gold
    if (type === 'gold') {
      const [mn, mx] = GOLD_RANGES[rarity - 1];
      amount = randInt(mn, mx);
    }
  }

  // Yawth: heal 10% max HP
  if (boatId === 'yawth') {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.1);
    updateHpUI();
  }

  // Jetsky: double speed/accel for 20s (or extend)
  if (boatId === 'jetsky') {
    triggerJetskyBoost();
  }

  // Fishing Boat: free scrap timer is handled separately (startBoatAbilityTimers)

  addToCargo({ type, name: formatTypeName(type, rarity), amount, rarity });
}

function formatTypeName(type, rarity) {
  if (type === 'gold')         return 'Gold';
  if (type === 'boat_part')    return `Boat Parts (R${rarity})`;
  if (type === 'ability_part') return `Ability Parts (R${rarity})`;
  return type;
}

// ============================================================
// EQUIPMENT STAT HELPERS
// ============================================================
function getItemStats(equipmentId, rarity) {
  const table = EQUIPMENT_STATS[equipmentId];
  return table ? (table[rarity] || null) : null;
}

function computeCargoSpace(equipmentId, rarity) {
  const stats = getItemStats(equipmentId, rarity);
  if (!stats) return 0;
  let space = stats.cargoSpace || 0;
  // Container Ship: equipment costs 10% of normal
  if (gameState && gameState.boat.id === 'container_ship') {
    space = Math.ceil(space * 0.1);
  }
  return space;
}

// ============================================================
// APPLY / REMOVE STAT BONUSES
// ============================================================
function applyStatBonus(item) {
  if (!player) return;
  // Recalculate everything — simpler and avoids drift
  recalculateAllStats();
}

function removeItemEffects(item, slotIndex) {
  // Clear interval timer if any
  if (inventory.timers[slotIndex]) {
    clearInterval(inventory.timers[slotIndex]);
    delete inventory.timers[slotIndex];
  }
}

function recalculateAllStats() {
  if (!player || !gameState) return;
  const boat = gameState.boat;

  // ---- Reset to boat base ----
  player.maxSpeedF   = boat.maxSpeedF;
  player.maxSpeedB   = boat.maxSpeedB;
  player.accelF      = boat.accelF;
  player.accelB      = boat.accelB;
  player.turnRatio   = boat.turnRatio;
  player.maxHp       = boat.maxHp;
  player.hpRegen     = boat.hpRegen;
  player.reach       = boat.reach;
  player.zoomMin     = boat.zoom;
  inventory.cargoMax = boat.capacity;

  player.damageReduction = 0;
  player.shieldHp        = 0;
  // preserve shield HP (don't overwrite if shield is live — handle separately)

  // ---- Apply equipment bonuses (additive from base) ----
  let shieldTotal = 0;
  let capacityExtra = 0;
  let regenBoostActive = false;

  for (const item of inventory.equipped) {
    if (!item) continue;
    const s = getItemStats(item.equipmentId, item.rarity);
    if (!s) continue;

    switch (item.equipmentId) {
      case 'speed_boost':
        player.maxSpeedF += s.maxSpeedBonus;
        player.accelF    += s.accelBonus;
        break;
      case 'turn_boost':
        player.turnRatio += s.turnBonus;
        break;
      case 'hp_boost':
        player.maxHp += s.hpBonus;
        break;
      case 'regen_boost':
        regenBoostActive = true;
        break;
      case 'reach_boost':
        player.reach += s.reachBonus;
        break;
      case 'zoom_boost':
        player.zoomMin = Math.max(0.1, player.zoomMin - s.zoomBonus);
        break;
      case 'capacity_boost':
        capacityExtra += s.capacityBonus;
        break;
      case 'shield':
        shieldTotal += s.shieldHp;
        break;
      case 'dmg_reduction':
        player.damageReduction += s.reductionPercent;
        break;
      case 'double_slot':
        capacityExtra -= (s.cargoReduction || 5);
        break;
    }
  }

  inventory.cargoMax = Math.max(1, boat.capacity + capacityExtra);

  // Shield: only set if no existing live shield tracking
  if (!player.shieldHpLive) player.shieldHpLive = shieldTotal;
  // Regen: handled by startRegenTimer but store flag
  player.regenBoostActive = regenBoostActive;

  // HP clamp
  player.hp = Math.min(player.hp, player.maxHp);

  updateStatsUI();
  updateHpUI();
  updateCargoCounter();
}

// ============================================================
// START PER-ITEM TIMERS
// ============================================================
function startItemTimers(item, slotIndex) {
  const s = getItemStats(item.equipmentId, item.rarity);
  if (!s) return;

  if (item.equipmentId === 'hp_growth') {
    item._growthBaseHp = gameState.boat.maxHp;
    item._growthAccum  = 0;
    inventory.timers[slotIndex] = setInterval(() => {
      if (!player) return;
      const gain = item._growthBaseHp * s.growthPercent;
      item._growthAccum += gain;
      player.maxHp = gameState.boat.maxHp + item._growthAccum;
      player.hp = Math.min(player.hp, player.maxHp);
      updateHpUI();
    }, s.growthInterval);
  }
}

// ============================================================
// START BOAT ABILITY TIMERS (called from initGame)
// ============================================================
function startBoatAbilityTimers() {
  if (!gameState) return;
  const boatId = gameState.boat.id;

  if (boatId === 'fishing_boat') {
    inventory.timers['fishing'] = setInterval(() => {
      const tile = findRandomWaterTile();
      if (tile) {
        const s = generateScrapItem(tile.x, tile.y);
        scrapList.push(s);
        mapGrid[tile.x][tile.y] = TILE.SCRAP;
        showToast('Fishing Boat found scrap!');
      }
    }, 30000);
  }

  if (boatId === 'surf_boat') {
    inventory.timers['surf'] = setInterval(() => {
      player.invincible = true;
      showToast('Surf Boat: 2s immunity!');
      setTimeout(() => { if (player) player.invincible = false; }, 2000);
    }, 20000);
  }

  if (boatId === 'coast_guard') {
    // Handled via button/activation — set up cooldown state
    player.coastGuardCooldown = false;
  }

  if (boatId === 'submarine') {
    player.submarineGhostCooldown = false;
  }
}

function findRandomWaterTile() {
  const playerTX = Math.floor(player.px / TILE_SIZE);
  const playerTY = Math.floor(player.py / TILE_SIZE);
  const minDist  = 10;
  let attempts   = 0;
  while (attempts < 300) {
    attempts++;
    const x = randInt(0, MAP_SIZE - 1);
    const y = randInt(0, MAP_SIZE - 1);
    if (mapGrid[x][y] !== TILE.WATER && mapGrid[x][y] !== TILE.INTERIOR) continue;
    const dx = x - playerTX, dy = y - playerTY;
    if (Math.sqrt(dx*dx+dy*dy) < minDist) continue;
    return { x, y };
  }
  return null;
}

// ============================================================
// ACTIVE ABILITY ACTIVATION (keyboard / button)
// Call this with the ability id
// ============================================================
function activateAbility(equipmentId) {
  const now = Date.now();
  const ae   = inventory.activeEffects;

  if (equipmentId === 'short_speed_boost') {
    if (now < ae.shortSpeedCooldownEnd) { showToast('Speed boost on cooldown!'); return; }
    const item = inventory.equipped.find(i => i && i.equipmentId === 'short_speed_boost');
    if (!item) return;
    const s = getItemStats('short_speed_boost', item.rarity);
    ae.shortSpeedBoostUntil  = now + s.duration;
    ae.shortSpeedCooldownEnd = now + s.duration + s.cooldown;
    ae.shortSpeedActive = true;
    // Apply
    player.maxSpeedF *= s.speedMultiplier;
    player.accelF    *= s.accelMultiplier;
    showToast('Speed Boost activated!');
    setTimeout(() => {
      ae.shortSpeedActive = false;
      recalculateAllStats();
    }, s.duration);
  }

  else if (equipmentId === 'damage_blocker') {
    if (now < ae.damageBlockerCooldownEnd) { showToast('Damage Blocker on cooldown!'); return; }
    const item = inventory.equipped.find(i => i && i.equipmentId === 'damage_blocker');
    if (!item) return;
    const s = getItemStats('damage_blocker', item.rarity);
    ae.damageBlockerUntil    = now + s.duration;
    ae.damageBlockerCooldownEnd = now + s.duration + s.cooldown;
    showToast('Damage Blocker active!');
  }

  else if (equipmentId === 'coast_guard_heal') {
    if (player.coastGuardCooldown) { showToast('Heal on cooldown!'); return; }
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.3);
    updateHpUI();
    player.coastGuardCooldown = true;
    showToast('Self-Repair activated!');
    setTimeout(() => { if (player) player.coastGuardCooldown = false; }, 30000);
  }

  else if (equipmentId === 'submarine_ghost') {
    if (player.submarineGhostCooldown) { showToast('Ghost on cooldown!'); return; }
    activateSubmarineGhost();
    player.submarineGhostCooldown = true;
    setTimeout(() => { if (player) player.submarineGhostCooldown = false; }, 120000);
  }
}

// ============================================================
// DAMAGE MODIFICATION (called from collision.js)
// ============================================================
function applyEquipmentDamageModifiers(amount) {
  if (!player) return amount;
  const now = Date.now();
  const ae  = inventory.activeEffects;

  // Damage Blocker active
  if (now < ae.damageBlockerUntil) return 0;

  // Surf Boat invincibility
  if (player.invincible) return 0;

  // Damage Reduction
  let dmg = amount;
  if (player.damageReduction > 0) {
    dmg *= (1 - Math.min(0.95, player.damageReduction));
  }

  // Shield (live HP tracking)
  if (player.shieldHpLive > 0) {
    if (dmg <= player.shieldHpLive) {
      player.shieldHpLive -= dmg;
      updateShieldUI();
      return 0;
    } else {
      dmg -= player.shieldHpLive;
      player.shieldHpLive = 0;
      // Destroy shield items
      for (let i = 0; i < inventory.equipped.length; i++) {
        if (inventory.equipped[i] && inventory.equipped[i].equipmentId === 'shield') {
          inventory.equipped[i] = null;
          inventory.cargoUsed -= computeCargoSpace('shield', 1); // approximate
          inventory.cargoUsed  = Math.max(0, inventory.cargoUsed);
        }
      }
      renderEquipmentUI();
      showToast('Shield destroyed!');
    }
  }

  return Math.ceil(dmg);
}

// ============================================================
// LIFESAVER CHECK (called from collision.js before death)
// Returns true if death was intercepted
// ============================================================
function checkLifesaver() {
  const now = Date.now();
  for (const item of inventory.equipped) {
    if (!item || item.equipmentId !== 'lifesaver') continue;
    if (item._lifesaverCooldownEnd && now < item._lifesaverCooldownEnd) continue;
    const s = getItemStats('lifesaver', item.rarity);
    player.hp = Math.max(1, player.maxHp * s.restorePercent);
    item._lifesaverCooldownEnd = now + s.cooldown;
    updateHpUI();
    showToast('Lifesaver activated!');
    return true;
  }
  return false;
}

// ============================================================
// CATAMARAN DEATH CHECK
// ============================================================
function checkCatamaranDeath() {
  if (!gameState || gameState.boat.id !== 'catamaran') return false;
  if (!player.catamaranTriggers) player.catamaranTriggers = 0;
  if (player.catamaranTriggers >= 2) return false;

  player.catamaranTriggers++;
  player.maxHp   = Math.floor(player.maxHp / 2);
  player.hpRegen = Math.floor(player.hpRegen / 2);
  player.hp      = Math.floor(player.maxHp * 0.5);
  updateHpUI();
  showToast(`Catamaran: reduced to ${player.maxHp} HP!`);
  return true;
}

// ============================================================
// JETSKY BOOST
// ============================================================
let jetskyTimer = null;
function triggerJetskyBoost() {
  if (!player) return;
  const boat = gameState.boat;
  if (jetskyTimer) {
    clearTimeout(jetskyTimer);
  } else {
    // First trigger — double stats
    player.maxSpeedF = boat.maxSpeedF * 2;
    player.accelF    = boat.accelF    * 2;
    showToast('Jetsky boost!');
  }
  // (Re)set 20s timer
  jetskyTimer = setTimeout(() => {
    jetskyTimer = null;
    if (player) {
      player.maxSpeedF = boat.maxSpeedF;
      player.accelF    = boat.accelF;
    }
  }, 20000);
}

// ============================================================
// SUBMARINE GHOST
// ============================================================
let submarineGhost = null;
function activateSubmarineGhost() {
  if (submarineGhost) return;
  submarineGhost = {
    px: player.px,
    py: player.py,
    hp: player.hp * 0.5,
    maxHp: player.hp * 0.5,
    heading: player.heading,
    active: true,
    expiresAt: Date.now() + 15000,
  };
  showToast('Ghost decoy deployed!');
  setTimeout(() => { submarineGhost = null; }, 15000);
}

// ============================================================
// CARGO UNLOAD (at port or manual)
// ============================================================
let lastManualUnload = 0;

function unloadAtPort() {
  // Remove all non-equipment cargo (gold, parts)
  cargoList = cargoList.filter(c => c.type === 'equipment');
  // Recalculate cargo used (only equipment left)
  recalcCargoUsed();
  renderCargoUI();
  updateCargoCounter();
  showToast('Cargo unloaded!');
}

function manualUnload() {
  const now = Date.now();
  if (now - lastManualUnload < 60000) {
    const remaining = Math.ceil((60000 - (now - lastManualUnload)) / 1000);
    showToast(`Manual unload available in ${remaining}s`);
    return;
  }
  lastManualUnload = now;
  unloadAtPort();
}

function recalcCargoUsed() {
  let used = 0;
  for (const item of inventory.equipped) {
    if (item) used += computeCargoSpace(item.equipmentId, item.rarity);
  }
  // Each distinct cargo stack takes 1 slot
  used += cargoList.length;
  inventory.cargoUsed = used;
}

// ============================================================
// WEAPON HELPERS (used by enemies.js)
// ============================================================
function getEquippedWeapons() {
  return inventory.equipped.filter(item => {
    if (!item) return false;
    const eq = EQUIPMENT.find(e => e.id === item.equipmentId);
    return eq && eq.class === 'Weapon';
  });
}

// ============================================================
// UI HELPERS
// ============================================================
function renderEquipmentUI() {
  const container = document.getElementById('game-equipment-slots');
  if (!container) return;
  container.innerHTML = '<div class="equipment-title">Equipment</div>';

  for (let i = 0; i < inventory.equipped.length; i++) {
    const slot = document.createElement('div');
    const item = inventory.equipped[i];
    if (item) {
      slot.className = 'equipment-slot filled';
      const eq = EQUIPMENT.find(e => e.id === item.equipmentId);
      const name = eq ? eq.name : item.equipmentId;
      slot.innerHTML = `<div style="font-size:9px;font-weight:bold;">${name}</div><div style="font-size:8px;color:#aaa;">R${item.rarity}${item.permanent?' 🔒':''}</div>`;
      slot.title = `${name} (R${item.rarity})`;
      if (!item.permanent) {
        slot.onclick = () => {
          if (confirm(`Discard ${name}? You'll get ${10*item.rarity} gold.`)) {
            discardEquippedItem(i);
          }
        };
      }
      if (item.permanent) slot.style.borderColor = '#ffb74d';
    } else {
      slot.className = 'equipment-slot empty';
      slot.textContent = 'Empty';
    }
    container.appendChild(slot);
  }
}

function renderCargoUI() {
  const panel = document.getElementById('cargo-panel');
  if (!panel) return;
  panel.innerHTML = '<div style="font-weight:bold;margin-bottom:4px;">Cargo</div>';
  if (cargoList.length === 0) {
    panel.innerHTML += '<div style="color:#666;font-size:10px;">Empty</div>';
    return;
  }
  for (let i = 0; i < cargoList.length; i++) {
    const c = cargoList[i];
    const row = document.createElement('div');
    row.style.cssText = 'font-size:10px;display:flex;justify-content:space-between;margin-bottom:2px;';
    row.innerHTML = `<span>${c.name}</span><span style="color:#aaa;">${c.amount !== undefined ? '×'+c.amount : ''}</span>`;
    panel.appendChild(row);
  }
}

function updateCargoCounter() {
  recalcCargoUsed();
  const el = document.getElementById('stat-cargo');
  if (el) el.textContent = `${inventory.cargoUsed} / ${inventory.cargoMax}`;
}

function updateStatsUI() {
  if (!player) return;
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('stat-max-speed', player.maxSpeedF.toFixed(1));
  set('stat-turn',      player.turnRatio.toFixed(3));
  set('stat-regen',     player.hpRegen.toFixed(1) + ' HP/5s');
  set('stat-reach',     player.reach + 'px');
}

function updateHpUI() {
  if (!player) return;
  const pct = Math.max(0, player.hp / player.maxHp);
  const bar = document.getElementById('game-hp-bar');
  const num = document.getElementById('game-hp-numbers');
  if (bar) {
    bar.style.width = (pct * 100) + '%';
    const r = Math.floor(255 * (1 - pct));
    const g = Math.floor(255 * pct);
    bar.style.background = `rgb(${r},${g},0)`;
  }
  if (num) num.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
}

function updateShieldUI() {
  // Visual indicator for shield HP — optional, add if shield bar element exists
}

function showToast(msg) {
  let toast = document.getElementById('game-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'game-toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:6px 14px;border-radius:6px;font-size:13px;z-index:999;pointer-events:none;transition:opacity 0.4s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}