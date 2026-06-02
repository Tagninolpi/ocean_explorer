// ---- PAGE NAVIGATION ----

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

// Note: handleLogin, handleCreate, handleLogout, session
// are defined in account.js — do not redefine here.

// ---- BOAT SELECTION ----
let selectedBoat = null;

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'page-boat-selection')    populateBoatSelection();
    if (pageId === 'page-shipyard')          populateShipyard();
    if (pageId === 'page-bestiary')          populateBestiary();
    if (pageId === 'page-equipment-catalog') populateEquipmentCatalog();
    if (pageId === 'page-scrap-reference')   populateScrapReference();
}

function populateBoatSelection() {
    const grid = document.getElementById('boat-selection-grid');
    grid.innerHTML = '';
    selectedBoat = null;
    document.getElementById('start-btn').disabled = true;

    BOATS.forEach(boat => {
        const cell = document.createElement('div');
        cell.className = 'boat-cell';
        cell.innerHTML = `<p>${boat.name}</p><p>Rarity: ${boat.rarity}</p>`;
        cell.onclick = () => selectBoat(boat, cell);
        grid.appendChild(cell);
    });
}

function selectBoat(boat, cell) {
    document.querySelectorAll('.boat-cell').forEach(c => c.classList.remove('selected'));
    cell.classList.add('selected');
    selectedBoat = boat;
    document.getElementById('start-btn').disabled = false;
}

function startGame() {
    if (!selectedBoat) return;
    showPage('page-game');
    initGame(selectedBoat);
}

// ---- SHIPYARD ----
function populateShipyard() {
    const grid = document.getElementById('shipyard-grid');
    grid.innerHTML = '';
    BOATS.forEach(boat => {
        const cell = document.createElement('div');
        cell.className = 'boat-cell';
        cell.innerHTML = `<p>${boat.name}</p><p>${boat.class}</p>`;
        cell.onclick = () => showBoatDetail(boat);
        grid.appendChild(cell);
    });
}

function showBoatDetail(boat) {
    const content = document.getElementById('boat-detail-content');
    content.innerHTML = `
        <h2>${boat.name}</h2>
        <p>Class: ${boat.class} | Rarity: ${boat.rarity}</p>
        <p>Speed: ${boat.maxSpeedF} | Turn: ${boat.turnRatio} | HP: ${boat.maxHp}</p>
        <p>Regen: ${boat.hpRegen} HP/5s | Reach: ${boat.reach} | Capacity: ${boat.capacity}</p>
        <p>Equipment slots: ${boat.equipmentSlots}</p>
        <h3>Ability</h3>
        <p>${boat.ability}</p>
    `;
    showPage('page-boat-detail');
}

// ---- BESTIARY ----
function populateBestiary() {
    const grid = document.getElementById('bestiary-grid');
    grid.innerHTML = '';
    ENEMIES.forEach(enemy => {
        const cell = document.createElement('div');
        cell.className = 'enemy-cell';
        cell.innerHTML = `<p>${enemy.name}</p><p>Rarity: ${enemy.rarity}</p>`;
        cell.onclick = () => showEnemyDetail(enemy);
        grid.appendChild(cell);
    });
}

function showEnemyDetail(enemy) {
    const content = document.getElementById('enemy-detail-content');
    content.innerHTML = `
        <h2>${enemy.name}</h2>
        <p>Rarity: ${enemy.rarity}</p>
        <p>Speed: ${enemy.speed} | HP: ${enemy.maxHp} | Regen: ${enemy.hpRegen} HP/5s</p>
        <p>Equipment slots: ${enemy.equipmentSlots}</p>
    `;
    showPage('page-enemy-detail');
}

// ---- EQUIPMENT CATALOG ----
function populateEquipmentCatalog() {
    const grid = document.getElementById('equipment-grid');
    grid.innerHTML = '';
    EQUIPMENT.forEach(eq => {
        const cell = document.createElement('div');
        cell.className = 'equipment-cell';
        cell.innerHTML = `<p>${eq.name}</p><p>${eq.class}</p>`;
        cell.onclick = () => showEquipmentDetail(eq);
        grid.appendChild(cell);
    });
}

function showEquipmentDetail(eq) {
    const content = document.getElementById('equipment-detail-content');
    content.innerHTML = `
        <h2>${eq.name}</h2>
        <p>Class: ${eq.class} | Rarity: ${eq.rarity}</p>
        <p>${eq.description}</p>
    `;
    showPage('page-equipment-detail');
}

// ---- SCRAP REFERENCE ----
function populateScrapReference() {
    const container = document.getElementById('scrap-bands');
    container.innerHTML = '';
    SCRAP_RARITIES.forEach(tier => {
        const band = document.createElement('div');
        band.className = 'scrap-band';
        band.innerHTML = `<h3>${tier.name} — ${tier.probability}%</h3>`;
        tier.items.forEach(item => {
            const row = document.createElement('p');
            row.textContent = `${item.name}: ${item.amount}`;
            band.appendChild(row);
        });
        container.appendChild(band);
    });
}