// ============================================================
// BOATS
// ============================================================
const BOATS = [
  // OLD CLASS
  { id: 'raft',               name: 'Raft',                    class: 'Old',        rarity: 1, maxSpeedF: 5.0, maxSpeedB: 1.5, accelF: 0.5,  accelB: 0.1,  turnRatio: 3, maxHp: 100, hpRegen: 2,  reach: 50,  zoom: 0.1, capacity: 1000, dimensions: {w: 20, h: 40}, decayFactor: 0.92, equipmentSlots: 1, ability: 'Speed boost inside whirlpools instead of slowdown' },
  { id: 'small_raft',         name: 'Small Raft',              class: 'Old',        rarity: 2, maxSpeedF: 4.0, maxSpeedB: 1.2, accelF: 0.4,  accelB: 0.1,  turnRatio: 0.20, maxHp: 80,  hpRegen: 2,  reach: 45,  zoom: 0.6, capacity: 10, dimensions: {w: 18, h: 35}, decayFactor: 0.91, equipmentSlots: 1, ability: 'Scrap pool filtered to gold only' },
  { id: 'caravel',            name: 'Caravel',                 class: 'Old',        rarity: 3, maxSpeedF: 4.5, maxSpeedB: 1.5, accelF: 0.45, accelB: 0.12, turnRatio: 0.12, maxHp: 120, hpRegen: 3,  reach: 55,  zoom: 0.5, capacity: 12, dimensions: {w: 22, h: 45}, decayFactor: 0.93, equipmentSlots: 2, ability: 'Doubles gold amount from every scrap pickup' },
  { id: 'brigantine',         name: 'Brigantine',              class: 'Old',        rarity: 4, maxSpeedF: 5.0, maxSpeedB: 2.0, accelF: 0.5,  accelB: 0.15, turnRatio: 0.10, maxHp: 140, hpRegen: 3,  reach: 55,  zoom: 0.5, capacity: 14, dimensions: {w: 25, h: 50}, decayFactor: 0.93, equipmentSlots: 2, ability: 'On collision with any mine: destroys it, takes no damage, spawns a new mine' },
  { id: 'pirate_ship',        name: 'Pirate Ship',             class: 'Old',        rarity: 5, maxSpeedF: 5.5, maxSpeedB: 2.0, accelF: 0.55, accelB: 0.15, turnRatio: 0.09, maxHp: 160, hpRegen: 4,  reach: 60,  zoom: 0.4, capacity: 16, dimensions: {w: 28, h: 55}, decayFactor: 0.94, equipmentSlots: 3, ability: 'Immune to cannon damage from enemies' },

  // BIG SHIPS CLASS
  { id: 'barge',              name: 'Barge',                   class: 'Big Ships',  rarity: 1, maxSpeedF: 2.5, maxSpeedB: 0.8, accelF: 0.15, accelB: 0.05, turnRatio: 0.05, maxHp: 300, hpRegen: 5,  reach: 60,  zoom: 0.4, capacity: 20, dimensions: {w: 40, h: 80}, decayFactor: 0.96, equipmentSlots: 1, ability: 'Increases amount gained from each scrap pickup' },
  { id: 'container_ship_small', name: 'Container Ship (Small)', class: 'Big Ships', rarity: 2, maxSpeedF: 2.5, maxSpeedB: 0.8, accelF: 0.15, accelB: 0.05, turnRatio: 0.05, maxHp: 280, hpRegen: 5,  reach: 65,  zoom: 0.4, capacity: 22, dimensions: {w: 42, h: 82}, decayFactor: 0.96, equipmentSlots: 2, ability: 'Increases rarity of collected scrap (shifts rarity roll upward)' },
  { id: 'tanker',             name: 'Tanker',                  class: 'Big Ships',  rarity: 3, maxSpeedF: 3.0, maxSpeedB: 1.0, accelF: 0.18, accelB: 0.06, turnRatio: 0.04, maxHp: 350, hpRegen: 6,  reach: 60,  zoom: 0.4, capacity: 24, dimensions: {w: 44, h: 88}, decayFactor: 0.97, equipmentSlots: 2, ability: 'Max speed increases proportionally to cargo fill. At 100% capacity max speed is doubled' },
  { id: 'container_ship',     name: 'Container Ship',          class: 'Big Ships',  rarity: 4, maxSpeedF: 2.8, maxSpeedB: 0.9, accelF: 0.16, accelB: 0.05, turnRatio: 0.04, maxHp: 320, hpRegen: 5,  reach: 65,  zoom: 0.4, capacity: 30, dimensions: {w: 46, h: 92}, decayFactor: 0.97, equipmentSlots: 3, ability: 'All equipment takes up 10% of its usual cargo space' },
  { id: 'titanic',            name: 'Titanic',                 class: 'Big Ships',  rarity: 5, maxSpeedF: 3.5, maxSpeedB: 1.0, accelF: 0.2,  accelB: 0.06, turnRatio: 0.03, maxHp: 400, hpRegen: 7,  reach: 70,  zoom: 0.3, capacity: 28, dimensions: {w: 50, h: 100}, decayFactor: 0.97, equipmentSlots: 3, ability: 'On contact with iceberg: doubles speed, fully immune to all iceberg effects' },

  // WARSHIPS CLASS
  { id: 'coast_guard',        name: 'Coast Guard',             class: 'Warships',   rarity: 1, maxSpeedF: 5.5, maxSpeedB: 2.0, accelF: 0.5,  accelB: 0.18, turnRatio: 0.12, maxHp: 200, hpRegen: 5,  reach: 60,  zoom: 0.5, capacity: 12, dimensions: {w: 25, h: 55}, decayFactor: 0.93, equipmentSlots: 1, ability: 'Self-repair / heal ability (active, 30s cooldown, heals 30% max HP)' },
  { id: 'cruiser',            name: 'Cruiser',                 class: 'Warships',   rarity: 2, maxSpeedF: 5.0, maxSpeedB: 1.8, accelF: 0.45, accelB: 0.15, turnRatio: 0.10, maxHp: 220, hpRegen: 4,  reach: 58,  zoom: 0.5, capacity: 14, dimensions: {w: 28, h: 60}, decayFactor: 0.94, equipmentSlots: 2, ability: 'Immunity to mine damage' },
  { id: 'destroyer',          name: 'Destroyer',               class: 'Warships',   rarity: 3, maxSpeedF: 6.0, maxSpeedB: 2.2, accelF: 0.55, accelB: 0.20, turnRatio: 0.11, maxHp: 180, hpRegen: 4,  reach: 60,  zoom: 0.5, capacity: 12, dimensions: {w: 24, h: 58}, decayFactor: 0.93, equipmentSlots: 2, ability: 'Immunity to collision damage and speed reduction from islands and icebergs' },
  { id: 'submarine',          name: 'Submarine',               class: 'Warships',   rarity: 4, maxSpeedF: 4.5, maxSpeedB: 1.5, accelF: 0.4,  accelB: 0.12, turnRatio: 0.09, maxHp: 250, hpRegen: 5,  reach: 55,  zoom: 0.5, capacity: 14, dimensions: {w: 22, h: 65}, decayFactor: 0.94, equipmentSlots: 3, ability: 'Passive: sees iceberg true hitbox. Active (2min cooldown): ghost decoy for 15s' },
  { id: 'aircraft_carrier',   name: 'Aircraft Carrier',        class: 'Warships',   rarity: 5, maxSpeedF: 4.0, maxSpeedB: 1.2, accelF: 0.35, accelB: 0.10, turnRatio: 0.06, maxHp: 350, hpRegen: 6,  reach: 80,  zoom: 0.4, capacity: 20, dimensions: {w: 55, h: 95}, decayFactor: 0.96, equipmentSlots: 4, ability: 'Enemies always drop equipment instead of scrap' },

  // SMALL BOATS CLASS
  { id: 'swimming_vest',      name: 'Swimming Vest',           class: 'Small Boats', rarity: 1, maxSpeedF: 6.0, maxSpeedB: 2.5, accelF: 0.6,  accelB: 0.25, turnRatio: 0.25, maxHp: 70,  hpRegen: 1,  reach: 40,  zoom: 0.7, capacity: 8,  dimensions: {w: 14, h: 22}, decayFactor: 0.89, equipmentSlots: 1, ability: 'Scrap pool filtered to boat parts only' },
  { id: 'inflatable_plank',   name: 'Inflatable Plank',        class: 'Small Boats', rarity: 2, maxSpeedF: 6.5, maxSpeedB: 2.5, accelF: 0.65, accelB: 0.25, turnRatio: 0.28, maxHp: 60,  hpRegen: 1,  reach: 38,  zoom: 0.7, capacity: 8,  dimensions: {w: 12, h: 20}, decayFactor: 0.88, equipmentSlots: 1, ability: 'Scrap pool filtered to ability parts only' },
  { id: 'surf_boat',          name: 'Surf Boat',               class: 'Small Boats', rarity: 3, maxSpeedF: 7.0, maxSpeedB: 3.0, accelF: 0.7,  accelB: 0.28, turnRatio: 0.22, maxHp: 80,  hpRegen: 1,  reach: 42,  zoom: 0.7, capacity: 9,  dimensions: {w: 16, h: 28}, decayFactor: 0.89, equipmentSlots: 2, ability: 'Every 20 seconds: immune to all damage for 2 seconds' },
  { id: 'windsurfer',         name: 'Windsurfer',              class: 'Small Boats', rarity: 4, maxSpeedF: 7.5, maxSpeedB: 3.0, accelF: 0.75, accelB: 0.30, turnRatio: 0.30, maxHp: 75,  hpRegen: 1,  reach: 40,  zoom: 0.7, capacity: 9,  dimensions: {w: 14, h: 26}, decayFactor: 0.88, equipmentSlots: 2, ability: 'While turning, speed increases instead of decreasing' },
  { id: 'jetsky',             name: 'Jetsky',                  class: 'Small Boats', rarity: 5, maxSpeedF: 8.0, maxSpeedB: 3.5, accelF: 0.8,  accelB: 0.35, turnRatio: 0.28, maxHp: 85,  hpRegen: 2,  reach: 45,  zoom: 0.7, capacity: 10, dimensions: {w: 16, h: 30}, decayFactor: 0.89, equipmentSlots: 3, ability: 'Collecting scrap doubles max speed and accel for 20s. New scrap extends timer by 20s' },

  // BOATS CLASS
  { id: 'inflatable_boat',    name: 'Inflatable Boat',         class: 'Boats',      rarity: 1, maxSpeedF: 4.0, maxSpeedB: 1.5, accelF: 0.35, accelB: 0.12, turnRatio: 0.18, maxHp: 120, hpRegen: 2,  reach: 50,  zoom: 0.6, capacity: 12, dimensions: {w: 20, h: 42}, decayFactor: 0.92, equipmentSlots: 1, ability: 'Permanent built-in minigun (no cargo cost, cannot be discarded)' },
  { id: 'fishing_boat',       name: 'Fishing Boat',            class: 'Boats',      rarity: 2, maxSpeedF: 3.5, maxSpeedB: 1.2, accelF: 0.30, accelB: 0.10, turnRatio: 0.15, maxHp: 130, hpRegen: 3,  reach: 60,  zoom: 0.6, capacity: 14, dimensions: {w: 22, h: 46}, decayFactor: 0.92, equipmentSlots: 2, ability: 'Every 30 seconds generates one free scrap item' },
  { id: 'sailing_boat',       name: 'Sailing Boat',            class: 'Boats',      rarity: 3, maxSpeedF: 4.5, maxSpeedB: 1.5, accelF: 0.40, accelB: 0.12, turnRatio: 0.16, maxHp: 150, hpRegen: 3,  reach: 55,  zoom: 0.5, capacity: 16, dimensions: {w: 24, h: 48}, decayFactor: 0.93, equipmentSlots: 2, ability: 'Max HP scales with cargo fill. At 100% capacity max HP is doubled' },
  { id: 'ferry',              name: 'Ferry',                   class: 'Boats',      rarity: 4, maxSpeedF: 4.0, maxSpeedB: 1.5, accelF: 0.35, accelB: 0.12, turnRatio: 0.14, maxHp: 180, hpRegen: 3,  reach: 55,  zoom: 0.5, capacity: 18, dimensions: {w: 30, h: 58}, decayFactor: 0.93, equipmentSlots: 2, ability: 'Max speed scales inversely with HP. At 0 HP max speed is doubled' },
  { id: 'catamaran',          name: 'Catamaran',               class: 'Boats',      rarity: 5, maxSpeedF: 5.0, maxSpeedB: 2.0, accelF: 0.45, accelB: 0.15, turnRatio: 0.18, maxHp: 160, hpRegen: 4,  reach: 60,  zoom: 0.5, capacity: 18, dimensions: {w: 36, h: 50}, decayFactor: 0.93, equipmentSlots: 3, ability: 'On death: halve max HP and regen, restore to 50% new max HP. Triggers twice max' },
  { id: 'yawth',              name: 'Yawth',                   class: 'Boats',      rarity: 6, maxSpeedF: 4.0, maxSpeedB: 1.5, accelF: 0.38, accelB: 0.13, turnRatio: 0.17, maxHp: 200, hpRegen: 5,  reach: 65,  zoom: 0.5, capacity: 20, dimensions: {w: 28, h: 52}, decayFactor: 0.93, equipmentSlots: 3, ability: 'Each scrap collected instantly heals 10% of current max HP' },
];

// ============================================================
// ENEMIES
// pointValue = wave budget cost to spawn this enemy
// ============================================================
const ENEMIES = [
  { id: 'normal_1', name: 'Normal', rarity: 1, speed: 1.5, maxHp: 80,  hpRegen: 1, equipmentSlots: 1, pointValue: 10, dimensions: {w: 16, h: 32} },
  { id: 'normal_2', name: 'Normal', rarity: 2, speed: 2.0, maxHp: 120, hpRegen: 2, equipmentSlots: 2, pointValue: 25, dimensions: {w: 18, h: 36} },
  { id: 'normal_3', name: 'Normal', rarity: 3, speed: 2.5, maxHp: 180, hpRegen: 3, equipmentSlots: 3, pointValue: 50, dimensions: {w: 20, h: 40} },
  { id: 'normal_4', name: 'Normal', rarity: 4, speed: 3.0, maxHp: 260, hpRegen: 4, equipmentSlots: 4, pointValue: 100, dimensions: {w: 22, h: 44} },
  { id: 'normal_5', name: 'Normal', rarity: 5, speed: 3.5, maxHp: 350, hpRegen: 5, equipmentSlots: 5, pointValue: 200, dimensions: {w: 24, h: 50} },
];

// ============================================================
// WAVE SYSTEM
// Budget starts at WAVE_BASE and grows by WAVE_SCALE per wave
// ============================================================
const WAVE_BASE = 50;          // budget for wave 1
const WAVE_SCALE = 30;         // budget increase per wave
const WAVE_DURATION = 120000;  // 2 minutes in ms
const ENEMY_SPAWN_MIN_DIST = 15; // tiles away from player minimum

// ============================================================
// EQUIPMENT (descriptions only — stats are in EQUIPMENT_STATS below)
// ============================================================
const EQUIPMENT = [
  // WEAPONS
  { id: 'cannon',          name: 'Cannon',                   class: 'Weapon',     rarities: [1,2,3,4,5] },
  { id: 'minigun',         name: 'Minigun',                  class: 'Weapon',     rarities: [1] },
  { id: 'mine_launcher',   name: 'Mine Launcher',            class: 'Weapon',     rarities: [1,2,3] },
  { id: 'grenade_launcher',name: 'Grenade Launcher',         class: 'Weapon',     rarities: [1,2,3] },

  // STAT BOOSTS
  { id: 'speed_boost',     name: 'Constant Speed Boost',     class: 'Stat Boost', rarities: [1,2,3] },
  { id: 'short_speed_boost',name:'Short Speed Boost',        class: 'Stat Boost', rarities: [1,2,3] },
  { id: 'turn_boost',      name: 'Constant Turn Boost',      class: 'Stat Boost', rarities: [1,2,3] },
  { id: 'hp_boost',        name: 'HP Boost',                 class: 'Stat Boost', rarities: [1,2,3] },
  { id: 'regen_boost',     name: 'HP Regen Boost',           class: 'Stat Boost', rarities: [1] },
  { id: 'reach_boost',     name: 'Reach Increase',           class: 'Stat Boost', rarities: [1,2,3] },
  { id: 'zoom_boost',      name: 'Zoom Increase',            class: 'Stat Boost', rarities: [1,2,3] },
  { id: 'capacity_boost',  name: 'Capacity Increase',        class: 'Stat Boost', rarities: [1,2,3] },

  // SPECIAL ABILITIES
  { id: 'shield',          name: 'Shield',                   class: 'Special',    rarities: [1,2,3] },
  { id: 'damage_blocker',  name: 'Damage Blocker',           class: 'Special',    rarities: [1] },
  { id: 'lifesaver',       name: 'Lifesaver',                class: 'Special',    rarities: [1,2,3] },
  { id: 'hp_growth',       name: 'Incremental HP Growth',    class: 'Special',    rarities: [1] },
  { id: 'double_slot',     name: 'Double Equipment Slot',    class: 'Special',    rarities: [1] },
  { id: 'dmg_reduction',   name: 'Damage Reduction',         class: 'Special',    rarities: [1] },
];

// ============================================================
// EQUIPMENT STATS — all numeric values per equipment per rarity
// cargoSpace: cargo slots consumed when equipped
// ============================================================
const EQUIPMENT_STATS = {
  // WEAPONS
  cannon: {
    1: { damage: 20,  range: 200, cooldown: 2000, cargoSpace: 2 },
    2: { damage: 35,  range: 250, cooldown: 2000, cargoSpace: 3 },
    3: { damage: 55,  range: 300, cooldown: 2000, cargoSpace: 4 },
    4: { damage: 80,  range: 350, cooldown: 2000, cargoSpace: 5 },
    5: { damage: 115, range: 400, cooldown: 2000, cargoSpace: 6 },
  },
  minigun: {
    1: { damagePerTick: 2, range: 150, tickRate: 100, duration: 10000, cooldown: 5000, cargoSpace: 2 },
  },
  mine_launcher: {
    1: { damage: 30, deployInterval: 5000, armDelay: 3000, lifetime: 30000, cargoSpace: 2 },
    2: { damage: 50, deployInterval: 5000, armDelay: 3000, lifetime: 30000, cargoSpace: 3 },
    3: { damage: 75, deployInterval: 5000, armDelay: 3000, lifetime: 30000, cargoSpace: 4 },
  },
  grenade_launcher: {
    1: { damage: 40,  range: 180, radius: 60,  cooldown: 3000, fuseTime: 2000, cargoSpace: 2 },
    2: { damage: 70,  range: 230, radius: 80,  cooldown: 3000, fuseTime: 2000, cargoSpace: 3 },
    3: { damage: 110, range: 280, radius: 100, cooldown: 3000, fuseTime: 2000, cargoSpace: 4 },
  },

  // STAT BOOSTS
  speed_boost: {
    1: { maxSpeedBonus: 0.5,  accelBonus: 0.05, cargoSpace: 1 },
    2: { maxSpeedBonus: 1.0,  accelBonus: 0.10, cargoSpace: 2 },
    3: { maxSpeedBonus: 1.8,  accelBonus: 0.18, cargoSpace: 3 },
  },
  short_speed_boost: {
    1: { speedMultiplier: 2.0, accelMultiplier: 2.5, duration: 10000, cooldown: 60000, cargoSpace: 2 },
    2: { speedMultiplier: 2.5, accelMultiplier: 3.0, duration: 10000, cooldown: 60000, cargoSpace: 3 },
    3: { speedMultiplier: 3.0, accelMultiplier: 3.5, duration: 10000, cooldown: 60000, cargoSpace: 4 },
  },
  turn_boost: {
    1: { turnBonus: 0.03, cargoSpace: 1 },
    2: { turnBonus: 0.06, cargoSpace: 2 },
    3: { turnBonus: 0.10, cargoSpace: 3 },
  },
  hp_boost: {
    1: { hpBonus: 20,  cargoSpace: 1 },
    2: { hpBonus: 40,  cargoSpace: 2 },
    3: { hpBonus: 70,  cargoSpace: 3 },
  },
  regen_boost: {
    1: { regenMultiplier: 3.0, intervalMultiplier: 2.0, cargoSpace: 2 },
  },
  reach_boost: {
    1: { reachBonus: 15, cargoSpace: 1 },
    2: { reachBonus: 30, cargoSpace: 2 },
    3: { reachBonus: 50, cargoSpace: 3 },
  },
  zoom_boost: {
    1: { zoomBonus: 0.10, cargoSpace: 1 },
    2: { zoomBonus: 0.20, cargoSpace: 2 },
    3: { zoomBonus: 0.35, cargoSpace: 3 },
  },
  capacity_boost: {
    1: { capacityBonus: 5,  cargoSpace: 0 },
    2: { capacityBonus: 12, cargoSpace: 0 },
    3: { capacityBonus: 25, cargoSpace: 0 },
  },

  // SPECIAL ABILITIES
  shield: {
    1: { shieldHp: 50,  cargoSpace: 2 },
    2: { shieldHp: 100, cargoSpace: 3 },
    3: { shieldHp: 180, cargoSpace: 4 },
  },
  damage_blocker: {
    1: { duration: 10000, cooldown: 90000, cargoSpace: 2 },
  },
  lifesaver: {
    1: { restorePercent: 0.30, cooldown: 120000, cargoSpace: 2 },
    2: { restorePercent: 0.50, cooldown: 120000, cargoSpace: 3 },
    3: { restorePercent: 0.75, cooldown: 120000, cargoSpace: 4 },
  },
  hp_growth: {
    1: { growthPercent: 0.01, growthInterval: 30000, cargoSpace: 2 },
  },
  double_slot: {
    1: { slotsGranted: 1, cargoReduction: 5, cargoSpace: 5 },
  },
  dmg_reduction: {
    1: { reductionPercent: 0.05, cargoSpace: 1 },
  },
};

// ============================================================
// SCRAP RARITY TABLE
// ============================================================
const SCRAP_RARITY_TABLE = [
  { rarity: 1, probability: 35 },
  { rarity: 2, probability: 30 },
  { rarity: 3, probability: 20 },
  { rarity: 4, probability: 10 },
  { rarity: 5, probability: 5  },
];

// Gold ranges per rarity
const GOLD_RANGES = [
  [10, 50],
  [50, 75],
  [100, 125],
  [200, 300],
  [1000, 3000],
];

// Part amount ranges per amount-rarity (1–3)
const PART_AMOUNT_RANGES = [
  [1,  5],
  [15, 25],
  [75, 100],
];

// ============================================================
// ISLAND DEFINITIONS
// ============================================================
const ISLAND_DEFINITIONS = {
  island_1: {
    id: 'island_1', name: 'Rocky Isle',
    chunkW: 10, chunkH: 8, radius: 280,
    polygon: [{x:-250,y:-200},{x:250,y:-200},{x:250,y:200},{x:-250,y:200}],
    tiles: generatePlaceholderTiles(10, 8),
  },
  island_2: {
    id: 'island_2', name: 'Merchant Cove',
    chunkW: 8, chunkH: 6, radius: 230,
    polygon: [{x:-200,y:-150},{x:200,y:-150},{x:200,y:150},{x:-200,y:150}],
    tiles: generatePlaceholderTiles(8, 6),
  },
  island_3: {
    id: 'island_3', name: 'Great Atoll',
    chunkW: 12, chunkH: 10, radius: 340,
    polygon: [{x:-300,y:-250},{x:300,y:-250},{x:300,y:250},{x:-300,y:250}],
    tiles: generatePlaceholderTiles(12, 10),
  },
  island_4: {
    id: 'island_4', name: 'Twin Rock',
    chunkW: 7, chunkH: 7, radius: 220,
    polygon: [{x:-175,y:-175},{x:175,y:-175},{x:175,y:175},{x:-175,y:175}],
    tiles: generatePlaceholderTiles(7, 7),
  },
  island_5: {
    id: 'island_5', name: 'Smugglers Rest',
    chunkW: 9, chunkH: 6, radius: 250,
    polygon: [{x:-225,y:-150},{x:225,y:-150},{x:225,y:150},{x:-225,y:150}],
    tiles: generatePlaceholderTiles(9, 6),
  },
};

function generatePlaceholderTiles(w, h) {
  const tiles = [];
  const cx = Math.floor(w / 2);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const isBorder = (x === 0 || x === w-1 || y === 0 || y === h-1);
      const isPort   = (x === cx && y === h-1);
      tiles.push({
        rx: x - Math.floor(w/2),
        ry: y - Math.floor(h/2),
        type: isPort ? 'port' : isBorder ? 'land' : 'interior',
      });
    }
  }
  return tiles;
}

// ============================================================
// MAP LAYOUTS
// ============================================================
const MAP_LAYOUTS = [
  [
    { islandId: 'island_1', tx: 15, ty: 15 },
    { islandId: 'island_2', tx: 60, ty: 20 },
    { islandId: 'island_3', tx: 35, ty: 50 },
    { islandId: 'island_4', tx: 75, ty: 65 },
    { islandId: 'island_5', tx: 20, ty: 75 },
  ],
  [
    { islandId: 'island_3', tx: 20, ty: 20 },
    { islandId: 'island_1', tx: 65, ty: 15 },
    { islandId: 'island_2', tx: 50, ty: 55 },
    { islandId: 'island_5', tx: 15, ty: 60 },
    { islandId: 'island_4', tx: 75, ty: 75 },
  ],
  [
    { islandId: 'island_2', tx: 10, ty: 10 },
    { islandId: 'island_4', tx: 55, ty: 10 },
    { islandId: 'island_1', tx: 30, ty: 40 },
    { islandId: 'island_3', tx: 65, ty: 55 },
    { islandId: 'island_5', tx: 10, ty: 70 },
  ],
];