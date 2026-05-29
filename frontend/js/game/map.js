// ============================================================
// MAP CONSTANTS
// ============================================================
const TILE_SIZE = 50;
const MAP_SIZE = 100;
const MAP_PIXEL_SIZE = TILE_SIZE * MAP_SIZE;

const TILE = {
    WATER: 0,
    LAND: 1,
    INTERIOR: 2,
    PORT: 3,
    ROCK: 4,
    ICEBERG: 5,
    WHIRLPOOL: 6,
    MINE: 7,
    SCRAP: 8,
};

let mapGrid = [];
let islandList = [];
let obstacleStore = {};
let scrapList = [];

// ============================================================
// GRID INITIALIZATION
// ============================================================
function initGrid() {
    mapGrid = [];
    for (let x = 0; x < MAP_SIZE; x++) {
        mapGrid[x] = [];
        for (let y = 0; y < MAP_SIZE; y++) {
            mapGrid[x][y] = TILE.WATER;
        }
    }
}

// ============================================================
// ISLAND PLACEMENT
// Uses MAP_LAYOUTS from data.js to place islands
// ============================================================
function placeIslands() {
    islandList = [];

    // Pick random layout
    const layout = MAP_LAYOUTS[randInt(0, MAP_LAYOUTS.length - 1)];

    for (const placement of layout) {
        const def = ISLAND_DEFINITIONS[placement.islandId];
        if (!def) { console.warn('Unknown island:', placement.islandId); continue; }

        const cx = placement.tx;
        const cy = placement.ty;

        // Write tiles to grid
        let portTile = null;
        for (const tile of def.tiles) {
            const tx = cx + tile.rx;
            const ty = cy + tile.ry;
            if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) continue;

            if (tile.type === 'port') {
                mapGrid[tx][ty] = TILE.PORT;
                portTile = { x: tx, y: ty };
            } else if (tile.type === 'interior') {
                mapGrid[tx][ty] = TILE.INTERIOR;
            } else {
                mapGrid[tx][ty] = TILE.LAND;
            }
        }

        // Offset polygon to world pixel position
        const centerPx = {
            x: cx * TILE_SIZE,
            y: cy * TILE_SIZE,
        };
        const worldPolygon = def.polygon.map(p => ({
            x: centerPx.x + p.x,
            y: centerPx.y + p.y,
        }));

        islandList.push({
            id: def.id,
            name: def.name,
            centerTile: { x: cx, y: cy },
            centerPx: centerPx,
            radius: def.radius,
            polygon: worldPolygon,
            port: portTile,
        });
    }
}

// ============================================================
// OBSTACLES
// ============================================================
const OBSTACLE_COUNTS = {
    rock:      50,
    iceberg:   50,
    whirlpool: 50,
    mine:      50,
};

const OBSTACLE_DEFAULTS = {
    rock:      { radius: 1.0 },
    iceberg:   { radius: 1.5, size: 2, revealed: false },
    whirlpool: { radius: 2.0, strength: 0.5 },
    mine:      { radius: 0.8, damage: 30 },
};

const TILE_TYPE_MAP = {
    rock:      TILE.ROCK,
    iceberg:   TILE.ICEBERG,
    whirlpool: TILE.WHIRLPOOL,
    mine:      TILE.MINE,
};

function placeObstacles() {
    obstacleStore = {};
    for (const [type, count] of Object.entries(OBSTACLE_COUNTS)) {
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < count * 20) {
            attempts++;
            const x = randInt(0, MAP_SIZE - 1);
            const y = randInt(0, MAP_SIZE - 1);
            if (mapGrid[x][y] !== TILE.WATER) continue;
            mapGrid[x][y] = TILE_TYPE_MAP[type];
            obstacleStore[`${x},${y}`] = { type, x, y, ...OBSTACLE_DEFAULTS[type] };
            placed++;
        }
    }
}

// ============================================================
// SCRAP
// ============================================================
const INITIAL_SCRAP_COUNT = 30;

function placeScrap() {
    scrapList = [];
    const availableTiles = [];
    
    // Collect both interior tiles and water tiles
    for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
            if (mapGrid[x][y] === TILE.INTERIOR || mapGrid[x][y] === TILE.WATER) {
                availableTiles.push({ x, y });
            }
        }
    }
    
    // Place scrap on available tiles
    for (let i = 0; i < INITIAL_SCRAP_COUNT && availableTiles.length > 0; i++) {
        const idx = randInt(0, availableTiles.length - 1);
        const tile = availableTiles.splice(idx, 1)[0];
        scrapList.push(generateScrapItem(tile.x, tile.y));
        mapGrid[tile.x][tile.y] = TILE.SCRAP;
    }
}

function generateScrapItem(x, y) {
    const roll = Math.random() * 100;
    let rarity;
    if      (roll < 35) rarity = 1;
    else if (roll < 65) rarity = 2;
    else if (roll < 85) rarity = 3;
    else if (roll < 95) rarity = 4;
    else                rarity = 5;

    const typeRoll = Math.random();
    let type, amount;

    if (typeRoll < 0.5) {
        type = 'gold';
        const ranges = [[10,50],[50,75],[100,125],[200,300],[1000,3000]];
        const [min, max] = ranges[rarity - 1];
        amount = randInt(min, max);
    } else {
        type = typeRoll < 0.75 ? 'boat_part' : 'ability_part';
        let partRarity, amountRarity;
        if (rarity === 1) {
            partRarity = 1; amountRarity = 1;
        } else {
            partRarity   = Math.min(3, Math.max(1, randInt(1, rarity - 1)));
            amountRarity = Math.min(3, Math.max(1, rarity - partRarity));
        }
        const amountRanges = [[1,5],[15,25],[75,100]];
        const [min, max] = amountRanges[amountRarity - 1];
        amount = randInt(min, max);
    }
    return { x, y, rarity, type, amount };
}

// ============================================================
// FULL MAP GENERATION
// ============================================================
function generateMap() {
    initGrid();
    placeIslands();
    placeObstacles();
    placeScrap();
    //console.log('Map generated:', islandList.length, 'islands,',Object.keys(obstacleStore).length, 'obstacles,',scrapList.length, 'scrap items');
}

// ============================================================
// RENDERING
// ============================================================
function renderMap(ctx, canvasSize, playerPx, zoom) {
    ctx.fillStyle = '#0a2a4a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const half = canvasSize / 2;
    const visR = half / (TILE_SIZE * zoom);
    const startX = Math.floor(playerPx.x / TILE_SIZE - visR);
    const startY = Math.floor(playerPx.y / TILE_SIZE - visR);
    const endX   = Math.ceil(playerPx.x  / TILE_SIZE + visR);
    const endY   = Math.ceil(playerPx.y  / TILE_SIZE + visR);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) continue;
            const tile = mapGrid[x][y];
            if (tile === TILE.WATER) continue;

            const sx = half + (x * TILE_SIZE - playerPx.x) * zoom;
            const sy = half + (y * TILE_SIZE - playerPx.y) * zoom;
            const ts = TILE_SIZE * zoom;

            ctx.fillStyle = getTileColor(tile);
            ctx.fillRect(sx, sy, ts, ts);
        }
    }
}

function getTileColor(tile) {
    switch(tile) {
        case TILE.LAND:      return '#4a7c3f';
        case TILE.INTERIOR:  return '#5a9c4f';
        case TILE.PORT:      return '#c8a850';
        case TILE.ROCK:      return '#666677';
        case TILE.ICEBERG:   return '#cce8ff';
        case TILE.WHIRLPOOL: return '#2255aa';
        case TILE.MINE:      return '#cc3333';
        case TILE.SCRAP:     return '#ffdd44';
        default:             return '#0a2a4a';
    }
}

// ============================================================
// UTILITIES
// ============================================================
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tileToPixel(tx, ty) {
    return { x: tx * TILE_SIZE, y: ty * TILE_SIZE };
}

function pixelToTile(px, py) {
    return { x: Math.floor(px / TILE_SIZE), y: Math.floor(py / TILE_SIZE) };
}