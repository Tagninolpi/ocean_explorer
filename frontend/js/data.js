// ============================================================
// BOATS
// ============================================================
const BOATS = [
  // OLD CLASS
  { id: 'raft', name: 'Raft', class: 'Old', rarity: 1, maxSpeedF: 50, maxSpeedB: 1, accelF: 0.5, accelB: 0.1, turnRatio: 15, maxHp: 100, hpRegen: 2, reach: 50, zoom: 0.1, capacity: 10, dimensions: {w: 20, h: 40}, decayFactor: 0.92, equipmentSlots: 1, ability: 'Speed boost inside whirlpools instead of slowdown' },
  { id: 'small_raft', name: 'Small Raft', class: 'Old', rarity: 2, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.2, accelB: 0.1, turnRatio: 3, maxHp: 100, hpRegen: 2, reach: 50, zoom: 0.9, capacity: 10, dimensions: {w: 20, h: 40}, decayFactor: 0.92, equipmentSlots: 1, ability: 'Scrap pool filtered to gold only' },
  { id: 'caravel', name: 'Caravel', class: 'Old', rarity: 3, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.2, accelB: 0.1, turnRatio: 3, maxHp: 100, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 10, dimensions: {w: 20, h: 40}, decayFactor: 0.92, equipmentSlots: 2, ability: 'Doubles gold amount from every scrap pickup' },
  { id: 'brigantine', name: 'Brigantine', class: 'Old', rarity: 4, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.2, accelB: 0.1, turnRatio: 3, maxHp: 100, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 10, dimensions: {w: 20, h: 40}, decayFactor: 0.92, equipmentSlots: 2, ability: 'On collision with any mine, destroys it, takes no damage, spawns a new mine at that position' },
  { id: 'pirate_ship', name: 'Pirate Ship', class: 'Old', rarity: 5, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.2, accelB: 0.1, turnRatio: 3, maxHp: 100, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 10, dimensions: {w: 20, h: 40}, decayFactor: 0.92, equipmentSlots: 3, ability: 'Immune to cannon damage from enemies' },

  // BIG SHIPS CLASS
  { id: 'barge', name: 'Barge', class: 'Big Ships', rarity: 1, maxSpeedF: 2, maxSpeedB: 1, accelF: 0.1, accelB: 0.05, turnRatio: 1, maxHp: 300, hpRegen: 5, reach: 60, zoom: 1.2, capacity: 20, dimensions: {w: 40, h: 80}, decayFactor: 0.95, equipmentSlots: 1, ability: 'Increases amount gained from each scrap pickup' },
  { id: 'container_ship_small', name: 'Container Ship (Small)', class: 'Big Ships', rarity: 2, maxSpeedF: 2, maxSpeedB: 1, accelF: 0.1, accelB: 0.05, turnRatio: 1, maxHp: 300, hpRegen: 5, reach: 60, zoom: 1.2, capacity: 20, dimensions: {w: 40, h: 80}, decayFactor: 0.95, equipmentSlots: 2, ability: 'Increases rarity of collected scrap' },
  { id: 'tanker', name: 'Tanker', class: 'Big Ships', rarity: 3, maxSpeedF: 2, maxSpeedB: 1, accelF: 0.1, accelB: 0.05, turnRatio: 1, maxHp: 300, hpRegen: 5, reach: 60, zoom: 1.2, capacity: 20, dimensions: {w: 40, h: 80}, decayFactor: 0.95, equipmentSlots: 2, ability: 'Max speed increases proportionally to cargo fill. At 100% capacity max speed is doubled' },
  { id: 'container_ship', name: 'Container Ship', class: 'Big Ships', rarity: 4, maxSpeedF: 2, maxSpeedB: 1, accelF: 0.1, accelB: 0.05, turnRatio: 1, maxHp: 300, hpRegen: 5, reach: 60, zoom: 1.2, capacity: 20, dimensions: {w: 40, h: 80}, decayFactor: 0.95, equipmentSlots: 3, ability: 'All equipment takes up 10% of its usual cargo space' },
  { id: 'titanic', name: 'Titanic', class: 'Big Ships', rarity: 5, maxSpeedF: 2, maxSpeedB: 1, accelF: 0.1, accelB: 0.05, turnRatio: 1, maxHp: 300, hpRegen: 5, reach: 60, zoom: 1.2, capacity: 20, dimensions: {w: 40, h: 80}, decayFactor: 0.95, equipmentSlots: 3, ability: 'On contact with iceberg: doubles current speed and is fully immune to all iceberg effects' },

  // WARSHIPS CLASS
  { id: 'coast_guard', name: 'Coast Guard', class: 'Warships', rarity: 1, maxSpeedF: 4, maxSpeedB: 2, accelF: 0.3, accelB: 0.15, turnRatio: 2, maxHp: 200, hpRegen: 4, reach: 55, zoom: 1.5, capacity: 12, dimensions: {w: 25, h: 55}, decayFactor: 0.93, equipmentSlots: 1, ability: 'Self-repair / heal ability' },
  { id: 'cruiser', name: 'Cruiser', class: 'Warships', rarity: 2, maxSpeedF: 4, maxSpeedB: 2, accelF: 0.3, accelB: 0.15, turnRatio: 2, maxHp: 200, hpRegen: 4, reach: 55, zoom: 1.5, capacity: 12, dimensions: {w: 25, h: 55}, decayFactor: 0.93, equipmentSlots: 2, ability: 'Immunity to mine damage' },
  { id: 'destroyer', name: 'Destroyer', class: 'Warships', rarity: 3, maxSpeedF: 4, maxSpeedB: 2, accelF: 0.3, accelB: 0.15, turnRatio: 2, maxHp: 200, hpRegen: 4, reach: 55, zoom: 1.5, capacity: 12, dimensions: {w: 25, h: 55}, decayFactor: 0.93, equipmentSlots: 2, ability: 'Immunity to collision damage and speed reduction from islands and icebergs' },
  { id: 'submarine', name: 'Submarine', class: 'Warships', rarity: 4, maxSpeedF: 4, maxSpeedB: 2, accelF: 0.3, accelB: 0.15, turnRatio: 2, maxHp: 200, hpRegen: 4, reach: 55, zoom: 1.5, capacity: 12, dimensions: {w: 25, h: 55}, decayFactor: 0.93, equipmentSlots: 3, ability: 'Passive: sees iceberg true hitbox. Active: places ghost at current position for 15s (2min cooldown)' },
  { id: 'aircraft_carrier', name: 'Aircraft Carrier', class: 'Warships', rarity: 5, maxSpeedF: 4, maxSpeedB: 2, accelF: 0.3, accelB: 0.15, turnRatio: 2, maxHp: 200, hpRegen: 4, reach: 55, zoom: 1.5, capacity: 12, dimensions: {w: 25, h: 55}, decayFactor: 0.93, equipmentSlots: 4, ability: 'Enemies always drop equipment instead of scrap' },

  // SMALL BOATS CLASS
  { id: 'swimming_vest', name: 'Swimming Vest', class: 'Small Boats', rarity: 1, maxSpeedF: 5, maxSpeedB: 2, accelF: 0.4, accelB: 0.2, turnRatio: 4, maxHp: 80, hpRegen: 1, reach: 40, zoom: 1.8, capacity: 8, dimensions: {w: 15, h: 25}, decayFactor: 0.90, equipmentSlots: 1, ability: 'Scrap pool filtered to boat parts only' },
  { id: 'inflatable_plank', name: 'Inflatable Plank', class: 'Small Boats', rarity: 2, maxSpeedF: 5, maxSpeedB: 2, accelF: 0.4, accelB: 0.2, turnRatio: 4, maxHp: 80, hpRegen: 1, reach: 40, zoom: 1.8, capacity: 8, dimensions: {w: 15, h: 25}, decayFactor: 0.90, equipmentSlots: 1, ability: 'Scrap pool filtered to ability parts only' },
  { id: 'surf_boat', name: 'Surf Boat', class: 'Small Boats', rarity: 3, maxSpeedF: 5, maxSpeedB: 2, accelF: 0.4, accelB: 0.2, turnRatio: 4, maxHp: 80, hpRegen: 1, reach: 40, zoom: 1.8, capacity: 8, dimensions: {w: 15, h: 25}, decayFactor: 0.90, equipmentSlots: 2, ability: 'Every 20 seconds: immune to all damage for 2 seconds' },
  { id: 'windsurfer', name: 'Windsurfer', class: 'Small Boats', rarity: 4, maxSpeedF: 5, maxSpeedB: 2, accelF: 0.4, accelB: 0.2, turnRatio: 4, maxHp: 80, hpRegen: 1, reach: 40, zoom: 1.8, capacity: 8, dimensions: {w: 15, h: 25}, decayFactor: 0.90, equipmentSlots: 2, ability: 'While turning, speed increases instead of decreasing' },
  { id: 'jetsky', name: 'Jetsky', class: 'Small Boats', rarity: 5, maxSpeedF: 5, maxSpeedB: 2, accelF: 0.4, accelB: 0.2, turnRatio: 4, maxHp: 80, hpRegen: 1, reach: 40, zoom: 1.8, capacity: 8, dimensions: {w: 15, h: 25}, decayFactor: 0.90, equipmentSlots: 3, ability: 'Collecting scrap doubles max speed and accel for 20s. New scrap extends timer by 20s' },

  // BOATS CLASS
  { id: 'inflatable_boat', name: 'Inflatable Boat', class: 'Boats', rarity: 1, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.25, accelB: 0.1, turnRatio: 2, maxHp: 120, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 12, dimensions: {w: 20, h: 45}, decayFactor: 0.92, equipmentSlots: 1, ability: 'Permanent built-in minigun (no cargo cost, cannot be discarded)' },
  { id: 'fishing_boat', name: 'Fishing Boat', class: 'Boats', rarity: 2, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.25, accelB: 0.1, turnRatio: 2, maxHp: 120, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 12, dimensions: {w: 20, h: 45}, decayFactor: 0.92, equipmentSlots: 2, ability: 'Every 30 seconds generates one free scrap item' },
  { id: 'sailing_boat', name: 'Sailing Boat', class: 'Boats', rarity: 3, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.25, accelB: 0.1, turnRatio: 2, maxHp: 120, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 12, dimensions: {w: 20, h: 45}, decayFactor: 0.92, equipmentSlots: 2, ability: 'Max HP scales with cargo fill. At 100% capacity max HP is doubled' },
  { id: 'ferry', name: 'Ferry', class: 'Boats', rarity: 4, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.25, accelB: 0.1, turnRatio: 2, maxHp: 120, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 12, dimensions: {w: 20, h: 45}, decayFactor: 0.92, equipmentSlots: 2, ability: 'Max speed scales inversely with HP. At 0 HP max speed is doubled' },
  { id: 'catamaran', name: 'Catamaran', class: 'Boats', rarity: 5, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.25, accelB: 0.1, turnRatio: 2, maxHp: 120, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 12, dimensions: {w: 20, h: 45}, decayFactor: 0.92, equipmentSlots: 3, ability: 'On death: halve max HP and regen, restore to 50% new max HP. Triggers twice max' },
  { id: 'yawth', name: 'Yawth', class: 'Boats', rarity: 6, maxSpeedF: 3, maxSpeedB: 1, accelF: 0.25, accelB: 0.1, turnRatio: 2, maxHp: 120, hpRegen: 2, reach: 50, zoom: 1.5, capacity: 12, dimensions: {w: 20, h: 45}, decayFactor: 0.92, equipmentSlots: 3, ability: 'Each scrap collected instantly heals 10% of current max HP' },
];

// ============================================================
// ENEMIES
// ============================================================
const ENEMIES = [
  { id: 'normal_1', name: 'Normal', rarity: 1, speed: 1.5, maxHp: 80,  hpRegen: 1, equipmentSlots: 1 },
  { id: 'normal_2', name: 'Normal', rarity: 2, speed: 2.0, maxHp: 120, hpRegen: 2, equipmentSlots: 2 },
  { id: 'normal_3', name: 'Normal', rarity: 3, speed: 2.5, maxHp: 180, hpRegen: 3, equipmentSlots: 3 },
  { id: 'normal_4', name: 'Normal', rarity: 4, speed: 3.0, maxHp: 260, hpRegen: 4, equipmentSlots: 4 },
  { id: 'normal_5', name: 'Normal', rarity: 5, speed: 3.5, maxHp: 350, hpRegen: 5, equipmentSlots: 5 },
];

// ============================================================
// EQUIPMENT
// ============================================================
const EQUIPMENT = [
  // WEAPONS
  { id: 'cannon', name: 'Cannon', class: 'Weapon', rarity: '1-5', description: 'Fires instantly at any target in range. Damage and range increase with rarity. Reload time is fixed.' },
  { id: 'minigun', name: 'Minigun', class: 'Weapon', rarity: '1', description: 'Continuous damage while target is in range for 10s. Cooldown only ticks down while in range.' },
  { id: 'mine_launcher', name: 'Mine Launcher', class: 'Weapon', rarity: '1-3', description: 'Auto-deploys a mine every 5s. Mines arm after 3s, auto-destruct after 30s. Damage increases with rarity.' },
  { id: 'grenade_launcher', name: 'Grenade Launcher', class: 'Weapon', rarity: '1-3', description: 'Fires at target with random offset. Red zone shows explosion area. Detonates after 2s. Damage, radius and range increase with rarity.' },

  // STAT BOOSTS
  { id: 'speed_boost', name: 'Constant Speed Boost', class: 'Stat Boost', rarity: '1-3', description: 'Permanently increases base max forward speed and acceleration. Stacks additively.' },
  { id: 'short_speed_boost', name: 'Short Speed Boost', class: 'Stat Boost', rarity: '1-3', description: 'On activation: large speed and accel boost for 10s. 1 minute cooldown after.' },
  { id: 'turn_boost', name: 'Constant Turn Boost', class: 'Stat Boost', rarity: '1-3', description: 'Permanently increases base turn ratio. Stacks additively.' },
  { id: 'hp_boost', name: 'HP Boost', class: 'Stat Boost', rarity: '1-3', description: 'Permanently increases base max HP. Stacks additively.' },
  { id: 'regen_boost', name: 'HP Regen Boost', class: 'Stat Boost', rarity: '1', description: 'Regen heals 3x per tick but fires half as often. Net 1.5x regen rate.' },
  { id: 'reach_boost', name: 'Reach Increase', class: 'Stat Boost', rarity: '1-3', description: 'Permanently increases item collection reach. Stacks additively.' },
  { id: 'zoom_boost', name: 'Zoom Increase', class: 'Stat Boost', rarity: '1-3', description: 'Permanently increases max zoom level. Stacks additively.' },
  { id: 'capacity_boost', name: 'Capacity Increase', class: 'Stat Boost', rarity: '1-3', description: 'Permanently adds cargo slots. Stacks additively.' },

  // SPECIAL ABILITIES
  { id: 'shield', name: 'Shield', class: 'Special', rarity: '1-3', description: 'Absorbs damage before HP is affected. Destroyed at 0 HP, not dropped.' },
  { id: 'damage_blocker', name: 'Damage Blocker', class: 'Special', rarity: '1', description: 'On activation: immune to all damage for 10s. 1.5 minute cooldown.' },
  { id: 'lifesaver', name: 'Lifesaver', class: 'Special', rarity: '1-3', description: 'When HP hits 0, restores HP instead of dying. 2 minute cooldown.' },
  { id: 'hp_growth', name: 'Incremental HP Growth', class: 'Special', rarity: '1', description: 'Increases max HP by 1% of initial max HP every 30s. Lost on discard.' },
  { id: 'double_slot', name: 'Double Equipment Slot', class: 'Special', rarity: '1', description: 'Grants 1 extra equipment slot at cost of cargo space. Discarding destroys all 3 linked items.' },
  { id: 'dmg_reduction', name: 'Damage Reduction', class: 'Special', rarity: '1', description: 'Reduces all incoming damage by 5%. Stacks with no cap.' },
];

// ============================================================
// SCRAP RARITIES
// ============================================================
const SCRAP_RARITIES = [
  {
    name: 'Common', probability: 35,
    items: [
      { name: 'Gold', amount: '10–50' },
      { name: 'Boat Parts (Common)', amount: '1–5 units' },
      { name: 'Ability Parts (Common)', amount: '1–5 units' },
    ]
  },
  {
    name: 'Uncommon', probability: 30,
    items: [
      { name: 'Gold', amount: '50–75' },
      { name: 'Boat Parts', amount: '1–5 units' },
      { name: 'Ability Parts', amount: '1–5 units' },
    ]
  },
  {
    name: 'Rare', probability: 20,
    items: [
      { name: 'Gold', amount: '100–125' },
      { name: 'Boat Parts', amount: '15–25 units' },
      { name: 'Ability Parts', amount: '15–25 units' },
    ]
  },
  {
    name: 'Epic', probability: 10,
    items: [
      { name: 'Gold', amount: '200–300' },
      { name: 'Boat Parts', amount: '15–25 units' },
      { name: 'Ability Parts', amount: '15–25 units' },
    ]
  },
  {
    name: 'Legendary', probability: 5,
    items: [
      { name: 'Gold', amount: '1000–3000' },
      { name: 'Boat Parts', amount: '75–100 units' },
      { name: 'Ability Parts', amount: '75–100 units' },
    ]
  },
];

// ============================================================
// ISLAND DEFINITIONS
// tiles: relative to center, type: 'land','interior','port','shore'
// polygon: relative points for SAT collision (placeholder = chunk corners)
// ============================================================
const ISLAND_DEFINITIONS = {
    island_1: {
        id: 'island_1',
        name: 'Rocky Isle',
        chunkW: 10, chunkH: 8,
        radius: 280, // pixels, for enemy pathfinding
        // Placeholder polygon — rectangle corners relative to center
        // Replace with hand-placed points later
        polygon: [
            { x: -250, y: -200 },
            { x:  250, y: -200 },
            { x:  250, y:  200 },
            { x: -250, y:  200 },
        ],
        // Placeholder tiles — full chunk as land with interior and one port
        // Replace with hand-authored layout later
        tiles: generatePlaceholderTiles(10, 8),
    },
    island_2: {
        id: 'island_2',
        name: 'Merchant Cove',
        chunkW: 8, chunkH: 6,
        radius: 230,
        polygon: [
            { x: -200, y: -150 },
            { x:  200, y: -150 },
            { x:  200, y:  150 },
            { x: -200, y:  150 },
        ],
        tiles: generatePlaceholderTiles(8, 6),
    },
    island_3: {
        id: 'island_3',
        name: 'Great Atoll',
        chunkW: 12, chunkH: 10,
        radius: 340,
        polygon: [
            { x: -300, y: -250 },
            { x:  300, y: -250 },
            { x:  300, y:  250 },
            { x: -300, y:  250 },
        ],
        tiles: generatePlaceholderTiles(12, 10),
    },
    island_4: {
        id: 'island_4',
        name: 'Twin Rock',
        chunkW: 7, chunkH: 7,
        radius: 220,
        polygon: [
            { x: -175, y: -175 },
            { x:  175, y: -175 },
            { x:  175, y:  175 },
            { x: -175, y:  175 },
        ],
        tiles: generatePlaceholderTiles(7, 7),
    },
    island_5: {
        id: 'island_5',
        name: 'Smugglers Rest',
        chunkW: 9, chunkH: 6,
        radius: 250,
        polygon: [
            { x: -225, y: -150 },
            { x:  225, y: -150 },
            { x:  225, y:  150 },
            { x: -225, y:  150 },
        ],
        tiles: generatePlaceholderTiles(9, 6),
    },
};

// Generates placeholder tile layout for an island chunk
// Border = land, interior = island_interior, one port on bottom center
function generatePlaceholderTiles(w, h) {
    const tiles = [];
    const cx = Math.floor(w / 2);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const isBorder = (x === 0 || x === w-1 || y === 0 || y === h-1);
            const isPort   = (x === cx && y === h-1);
            tiles.push({
                rx: x - Math.floor(w/2), // relative to center
                ry: y - Math.floor(h/2),
                type: isPort ? 'port' : isBorder ? 'land' : 'interior',
            });
        }
    }
    return tiles;
}

// ============================================================
// MAP LAYOUTS
// Each layout is a list of { islandId, tx, ty } (tile coordinates)
// Duplicates allowed. Number of layouts and positions TBD.
// ============================================================
const MAP_LAYOUTS = [
    // Layout 1
    [
        { islandId: 'island_1', tx: 15, ty: 15 },
        { islandId: 'island_2', tx: 60, ty: 20 },
        { islandId: 'island_3', tx: 35, ty: 50 },
        { islandId: 'island_4', tx: 75, ty: 65 },
        { islandId: 'island_5', tx: 20, ty: 75 },
    ],
    // Layout 2
    [
        { islandId: 'island_3', tx: 20, ty: 20 },
        { islandId: 'island_1', tx: 65, ty: 15 },
        { islandId: 'island_2', tx: 50, ty: 55 },
        { islandId: 'island_5', tx: 15, ty: 60 },
        { islandId: 'island_4', tx: 75, ty: 75 },
    ],
    // Layout 3
    [
        { islandId: 'island_2', tx: 10, ty: 10 },
        { islandId: 'island_4', tx: 55, ty: 10 },
        { islandId: 'island_1', tx: 30, ty: 40 },
        { islandId: 'island_3', tx: 65, ty: 55 },
        { islandId: 'island_5', tx: 10, ty: 70 },
    ],
];