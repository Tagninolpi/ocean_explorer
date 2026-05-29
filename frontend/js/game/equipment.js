// ============================================================
// EQUIPMENT SYSTEM
// Manages player inventory, equipment slots, and stat bonuses
// ============================================================

// ============================================================
// EQUIPMENT DATABASE
// Enhanced equipment data with specific stat values per rarity
// ============================================================
const EQUIPMENT_STATS = {
    // WEAPONS
    cannon: {
        1: { damage: 20, range: 200, cooldown: 2000, cargoSpace: 5 },
        2: { damage: 35, range: 250, cooldown: 2000, cargoSpace: 8 },
        3: { damage: 55, range: 300, cooldown: 2000, cargoSpace: 12 },
        4: { damage: 80, range: 350, cooldown: 2000, cargoSpace: 18 },
        5: { damage: 115, range: 400, cooldown: 2000, cargoSpace: 25 },
    },
    minigun: {
        1: { damagePerTick: 2, range: 150, tickRate: 100, duration: 10000, cargoSpace: 5 },
    },
    mine_launcher: {
        1: { damage: 30, deployInterval: 5000, armDelay: 3000, lifetime: 30000, cargoSpace: 8 },
        2: { damage: 50, deployInterval: 5000, armDelay: 3000, lifetime: 30000, cargoSpace: 12 },
        3: { damage: 75, deployInterval: 5000, armDelay: 3000, lifetime: 30000, cargoSpace: 18 },
    },
    grenade_launcher: {
        1: { damage: 40, range: 180, radius: 60, cooldown: 3000, fuseTime: 2000, cargoSpace: 10 },
        2: { damage: 70, range: 230, radius: 80, cooldown: 3000, fuseTime: 2000, cargoSpace: 15 },
        3: { damage: 110, range: 280, radius: 100, cooldown: 3000, fuseTime: 2000, cargoSpace: 22 },
    },

    // STAT BOOSTS
    speed_boost: {
        1: { maxSpeedBonus: 0.5, accelBonus: 0.05, cargoSpace: 3 },
        2: { maxSpeedBonus: 1.0, accelBonus: 0.1, cargoSpace: 5 },
        3: { maxSpeedBonus: 1.8, accelBonus: 0.18, cargoSpace: 8 },
    },
    short_speed_boost: {
        1: { speedMultiplier: 2.0, accelMultiplier: 2.5, duration: 10000, cooldown: 60000, cargoSpace: 4 },
        2: { speedMultiplier: 2.5, accelMultiplier: 3.0, duration: 10000, cooldown: 60000, cargoSpace: 7 },
        3: { speedMultiplier: 3.0, accelMultiplier: 3.5, duration: 10000, cooldown: 60000, cargoSpace: 12 },
    },
    turn_boost: {
        1: { turnBonus: 0.3, cargoSpace: 3 },
        2: { turnBonus: 0.6, cargoSpace: 5 },
        3: { turnBonus: 1.0, cargoSpace: 8 },
    },
    hp_boost: {
        1: { hpBonus: 20, cargoSpace: 4 },
        2: { hpBonus: 40, cargoSpace: 7 },
        3: { hpBonus: 70, cargoSpace: 12 },
    },
    regen_boost: {
        1: { regenMultiplier: 1.5, cargoSpace: 5 },
    },
    reach_boost: {
        1: { reachBonus: 15, cargoSpace: 2 },
        2: { reachBonus: 30, cargoSpace: 4 },
        3: { reachBonus: 50, cargoSpace: 6 },
    },
    zoom_boost: {
        1: { zoomBonus: 0.1, cargoSpace: 2 },
        2: { zoomBonus: 0.2, cargoSpace: 4 },
        3: { zoomBonus: 0.35, cargoSpace: 6 },
    },
    capacity_boost: {
        1: { capacityBonus: 5, cargoSpace: 0 },  // no cargo cost since it adds cargo
        2: { capacityBonus: 12, cargoSpace: 0 },
        3: { capacityBonus: 25, cargoSpace: 0 },
    },

    // SPECIAL ABILITIES
    shield: {
        1: { shieldHp: 50, cargoSpace: 6 },
        2: { shieldHp: 100, cargoSpace: 10 },
        3: { shieldHp: 180, cargoSpace: 16 },
    },
    damage_blocker: {
        1: { duration: 10000, cooldown: 90000, cargoSpace: 8 },
    },
    lifesaver: {
        1: { restorePercent: 0.30, cooldown: 120000, cargoSpace: 10 },
        2: { restorePercent: 0.50, cooldown: 120000, cargoSpace: 15 },
        3: { restorePercent: 0.75, cooldown: 120000, cargoSpace: 22 },
    },
    hp_growth: {
        1: { growthPercent: 0.01, growthInterval: 30000, cargoSpace: 5 },
    },
    double_slot: {
        1: { slotsGranted: 1, cargoSpace: 15 },
    },
    dmg_reduction: {
        1: { reductionPercent: 0.05, cargoSpace: 4 },
    },
};

// ============================================================
// INVENTORY SYSTEM
// ============================================================
let inventory = {
    equipped: [],      // Array of equipped items: { equipmentId, rarity, slotIndex }
    cargo: [],         // Array of cargo items: { type, name, amount, rarity? }
    cargoUsed: 0,      // Current cargo space used
    cargoMax: 0,       // Max cargo capacity (from boat + bonuses)
};

// ============================================================
// INITIALIZE INVENTORY
// Called when game starts with selected boat
// ============================================================
function initInventory(boat) {
    inventory.equipped = [];
    inventory.cargo = [];
    inventory.cargoUsed = 0;
    inventory.cargoMax = boat.capacity;

    // Initialize empty equipment slots
    for (let i = 0; i < boat.equipmentSlots; i++) {
        inventory.equipped.push(null);
    }

    // Special case: Inflatable Boat starts with built-in minigun
    if (boat.id === 'inflatable_boat') {
        inventory.equipped[0] = {
            equipmentId: 'minigun',
            rarity: 1,
            slotIndex: 0,
            permanent: true,  // cannot be unequipped
        };
    }

    updateCargoUI();
    updateEquipmentSlotsUI();
}

// ============================================================
// EQUIP ITEM
// ============================================================
function equipItem(equipmentId, rarity, slotIndex) {
    if (!player) return false;
    
    // Validate slot index
    if (slotIndex < 0 || slotIndex >= inventory.equipped.length) {
        console.warn('Invalid equipment slot:', slotIndex);
        return false;
    }

    // Check if slot is occupied
    if (inventory.equipped[slotIndex] !== null) {
        console.warn('Slot already occupied. Unequip first.');
        return false;
    }

    // Get equipment stats
    const stats = EQUIPMENT_STATS[equipmentId];
    if (!stats || !stats[rarity]) {
        console.warn('Invalid equipment or rarity:', equipmentId, rarity);
        return false;
    }

    const itemStats = stats[rarity];
    const cargoNeeded = itemStats.cargoSpace || 0;

    // Check cargo capacity
    if (inventory.cargoUsed + cargoNeeded > inventory.cargoMax) {
        console.warn('Not enough cargo space');
        showCargoError('Not enough cargo space!');
        return false;
    }

    // Equip the item
    inventory.equipped[slotIndex] = {
        equipmentId,
        rarity,
        slotIndex,
        permanent: false,
    };

    // Update cargo usage
    inventory.cargoUsed += cargoNeeded;

    // Recalculate stats
    recalculatePlayerStats();
    updateEquipmentSlotsUI();
    updateCargoUI();

    console.log(`Equipped ${equipmentId} (rarity ${rarity}) to slot ${slotIndex}`);
    return true;
}

// ============================================================
// UNEQUIP ITEM
// ============================================================
function unequipItem(slotIndex) {
    if (!player) return false;

    const item = inventory.equipped[slotIndex];
    if (!item) {
        console.warn('No item in slot:', slotIndex);
        return false;
    }

    // Check if permanent (built-in)
    if (item.permanent) {
        console.warn('Cannot unequip permanent item');
        showCargoError('Built-in equipment cannot be removed!');
        return false;
    }

    // Get cargo space back
    const stats = EQUIPMENT_STATS[item.equipmentId];
    const itemStats = stats[item.rarity];
    const cargoFreed = itemStats.cargoSpace || 0;

    // Remove item
    inventory.equipped[slotIndex] = null;
    inventory.cargoUsed -= cargoFreed;

    // Add to cargo as an equipment item
    addToCargo({
        type: 'equipment',
        equipmentId: item.equipmentId,
        rarity: item.rarity,
        name: getEquipmentName(item.equipmentId, item.rarity),
    });

    // Recalculate stats
    recalculatePlayerStats();
    updateEquipmentSlotsUI();
    updateCargoUI();

    console.log(`Unequipped ${item.equipmentId} from slot ${slotIndex}`);
    return true;
}

// ============================================================
// RECALCULATE PLAYER STATS
// Apply all equipment bonuses to player
// ============================================================
function recalculatePlayerStats() {
    if (!player) return;

    // Reset to base stats (from boat)
    const boat = gameState.boat;
    player.maxSpeedF = boat.maxSpeedF;
    player.maxSpeedB = boat.maxSpeedB;
    player.accelF = boat.accelF;
    player.accelB = boat.accelB;
    player.turnRatio = boat.turnRatio;
    player.maxHp = boat.maxHp;
    player.hpRegen = boat.hpRegen;
    player.reach = boat.reach;
    player.zoomMin = boat.zoom;
    inventory.cargoMax = boat.capacity;

    // Reset special modifiers
    player.damageReduction = 0;
    player.shieldHp = 0;
    player.activeAbilities = [];

    // Apply equipment bonuses
    for (const item of inventory.equipped) {
        if (!item) continue;

        const stats = EQUIPMENT_STATS[item.equipmentId];
        const itemStats = stats[item.rarity];

        // Stat boosts
        if (item.equipmentId === 'speed_boost') {
            player.maxSpeedF += itemStats.maxSpeedBonus;
            player.accelF += itemStats.accelBonus;
        }
        else if (item.equipmentId === 'turn_boost') {
            player.turnRatio += itemStats.turnBonus;
        }
        else if (item.equipmentId === 'hp_boost') {
            player.maxHp += itemStats.hpBonus;
        }
        else if (item.equipmentId === 'regen_boost') {
            player.hpRegen *= itemStats.regenMultiplier;
        }
        else if (item.equipmentId === 'reach_boost') {
            player.reach += itemStats.reachBonus;
        }
        else if (item.equipmentId === 'zoom_boost') {
            player.zoomMin = Math.max(0.1, player.zoomMin - itemStats.zoomBonus);
        }
        else if (item.equipmentId === 'capacity_boost') {
            inventory.cargoMax += itemStats.capacityBonus;
        }
        else if (item.equipmentId === 'shield') {
            player.shieldHp += itemStats.shieldHp;
        }
        else if (item.equipmentId === 'dmg_reduction') {
            player.damageReduction += itemStats.reductionPercent;
        }
        // Weapons and active abilities are handled separately
    }

    // Ensure HP doesn't exceed new max
    player.hp = Math.min(player.hp, player.maxHp);

    // Update UI
    updateStatsUI();
}

// ============================================================
// CARGO MANAGEMENT
// ============================================================
function addToCargo(item) {
    // Check if stackable (gold, parts)
    if (item.type === 'gold' || item.type === 'boat_part' || item.type === 'ability_part') {
        // Find existing stack
        const existing = inventory.cargo.find(
            c => c.type === item.type && 
                 (!item.rarity || c.rarity === item.rarity)
        );
        
        if (existing) {
            existing.amount += item.amount;
        } else {
            inventory.cargo.push({ ...item });
        }
    } else {
        // Non-stackable (equipment)
        inventory.cargo.push({ ...item });
    }

    updateCargoUI();
}

function removeFromCargo(index) {
    if (index < 0 || index >= inventory.cargo.length) return null;
    const item = inventory.cargo.splice(index, 1)[0];
    updateCargoUI();
    return item;
}

// ============================================================
// UI UPDATES
// ============================================================
function updateEquipmentSlotsUI() {
    const container = document.getElementById('game-equipment-slots');
    if (!container) return;

    // Clear and rebuild
    container.innerHTML = '<div class="equipment-title">Equipment</div>';

    for (let i = 0; i < inventory.equipped.length; i++) {
        const slot = document.createElement('div');
        const item = inventory.equipped[i];

        if (item) {
            slot.className = 'equipment-slot filled';
            const name = getEquipmentName(item.equipmentId, item.rarity);
            slot.innerHTML = `
                <div style="font-size: 9px; font-weight: bold;">${name}</div>
                <div style="font-size: 8px; color: #aaa;">R${item.rarity}</div>
            `;
            slot.onclick = () => {
                if (!item.permanent) {
                    if (confirm(`Unequip ${name}?`)) {
                        unequipItem(i);
                    }
                }
            };
            if (item.permanent) {
                slot.style.borderColor = '#ffb74d';
            }
        } else {
            slot.className = 'equipment-slot empty';
            slot.textContent = 'Empty';
            slot.onclick = () => openEquipmentSelector(i);
        }

        container.appendChild(slot);
    }
}

function updateCargoUI() {
    const cargoDisplay = document.getElementById('stat-cargo');
    if (cargoDisplay) {
        cargoDisplay.textContent = `${inventory.cargoUsed} / ${inventory.cargoMax}`;
    }

    // Update cargo panel if it exists (we'll create this later)
    const cargoPanel = document.getElementById('cargo-panel');
    if (cargoPanel) {
        cargoPanel.innerHTML = '<h3>Cargo</h3>';
        inventory.cargo.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'cargo-item';
            row.textContent = formatCargoItem(item);
            cargoPanel.appendChild(row);
        });
    }
}

function updateStatsUI() {
    if (!player) return;

    document.getElementById('stat-max-speed').textContent = player.maxSpeedF.toFixed(1);
    document.getElementById('stat-turn').textContent = player.turnRatio.toFixed(1);
    document.getElementById('stat-regen').textContent = player.hpRegen.toFixed(1) + ' HP/5s';
    document.getElementById('stat-reach').textContent = player.reach + 'px';
    document.getElementById('stat-cargo').textContent = `${inventory.cargoUsed} / ${inventory.cargoMax}`;

    // Update HP bar to reflect new max
    const pct = player.hp / player.maxHp;
    document.getElementById('game-hp-bar').style.width = (pct * 100) + '%';
    document.getElementById('game-hp-numbers').textContent =
        Math.ceil(player.hp) + ' / ' + player.maxHp;
}

// ============================================================
// EQUIPMENT SELECTOR UI
// Opens modal to select equipment from cargo
// ============================================================
function openEquipmentSelector(slotIndex) {
    // Get all equipment items from cargo
    const equipmentItems = inventory.cargo.filter(item => item.type === 'equipment');

    if (equipmentItems.length === 0) {
        alert('No equipment in cargo!');
        return;
    }

    // Create simple prompt-based selector (replace with proper UI later)
    let message = 'Select equipment to equip:\n\n';
    equipmentItems.forEach((item, i) => {
        message += `${i + 1}. ${item.name}\n`;
    });

    const choice = prompt(message + '\nEnter number (or 0 to cancel):');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < equipmentItems.length) {
        const selectedItem = equipmentItems[index];
        
        // Find and remove from cargo
        const cargoIndex = inventory.cargo.indexOf(selectedItem);
        removeFromCargo(cargoIndex);

        // Equip it
        equipItem(selectedItem.equipmentId, selectedItem.rarity, slotIndex);
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getEquipmentName(equipmentId, rarity) {
    const eq = EQUIPMENT.find(e => e.id === equipmentId);
    if (!eq) return 'Unknown';
    
    // For items with variable rarity, show rarity in name
    if (eq.rarity.includes('-')) {
        return `${eq.name} ${rarity}`;
    }
    return eq.name;
}

function formatCargoItem(item) {
    if (item.type === 'equipment') {
        return `${item.name} (R${item.rarity})`;
    } else if (item.type === 'gold') {
        return `Gold: ${item.amount}`;
    } else if (item.type === 'boat_part') {
        return `Boat Parts (R${item.rarity}): ${item.amount}`;
    } else if (item.type === 'ability_part') {
        return `Ability Parts (R${item.rarity}): ${item.amount}`;
    }
    return 'Unknown item';
}

function showCargoError(message) {
    // Simple alert for now, replace with proper UI toast later
    console.warn(message);
    // Could add a visual error indicator here
}

// ============================================================
// SCRAP COLLECTION INTEGRATION
// Called from collision.js when scrap is collected
// ============================================================
function onScrapCollected(scrap) {
    const item = {
        type: scrap.type,
        amount: scrap.amount,
        rarity: scrap.rarity,
    };

    if (item.type === 'gold') {
        item.name = 'Gold';
    } else if (item.type === 'boat_part') {
        item.name = `Boat Parts (R${item.rarity})`;
    } else if (item.type === 'ability_part') {
        item.name = `Ability Parts (R${item.rarity})`;
    }

    addToCargo(item);
    console.log('Collected:', formatCargoItem(item));
}

// ============================================================
// GET EQUIPPED WEAPONS
// Returns array of equipped weapon items for combat system
// ============================================================
function getEquippedWeapons() {
    return inventory.equipped.filter(item => {
        if (!item) return false;
        const eq = EQUIPMENT.find(e => e.id === item.equipmentId);
        return eq && eq.class === 'Weapon';
    });
}

// ============================================================
// GET ACTIVE ABILITIES
// Returns array of equipped activatable items
// ============================================================
function getActiveAbilities() {
    const activeIds = ['short_speed_boost', 'damage_blocker'];
    return inventory.equipped.filter(item => {
        if (!item) return false;
        return activeIds.includes(item.equipmentId);
    });
}

// ============================================================
// DAMAGE MODIFICATION
// Apply damage reduction from equipment
// ============================================================
function applyEquipmentDamageModifiers(incomingDamage) {
    if (!player) return incomingDamage;

    let finalDamage = incomingDamage;

    // Apply damage reduction
    if (player.damageReduction > 0) {
        finalDamage *= (1 - Math.min(0.95, player.damageReduction)); // Cap at 95% reduction
    }

    // Apply shield
    if (player.shieldHp > 0) {
        if (finalDamage <= player.shieldHp) {
            player.shieldHp -= finalDamage;
            return 0;
        } else {
            finalDamage -= player.shieldHp;
            player.shieldHp = 0;
        }
    }

    return Math.ceil(finalDamage);
}