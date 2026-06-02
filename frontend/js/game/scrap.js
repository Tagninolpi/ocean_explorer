// ============================================================
// SCRAP — extra collection logic for equipment drops
// Called from collision.js collectScrap
// ============================================================

// Hook into collectScrap: handle equipment_drop type
// The base collectScrap calls onScrapCollected for normal scrap.
// For equipment_drop type we instead try to auto-equip.
function handleScrapCollect(scrap) {
    if (scrap.type === 'equipment_drop') {
        const equipped = tryAutoEquipItem(scrap.equipmentId, scrap.equipRarity);
        if (!equipped) {
            // No slot — add to cargo as equipment item (takes cargo space)
            const eq = EQUIPMENT.find(e => e.id === scrap.equipmentId);
            const name = eq ? eq.name : scrap.equipmentId;
            addToCargo({
                type: 'equipment',
                equipmentId: scrap.equipmentId,
                rarity: scrap.equipRarity,
                name: `${name} R${scrap.equipRarity}`,
                amount: 1,
            });
        }
        return;
    }
    // Normal scrap
    onScrapCollected(scrap);
}

// ============================================================
// SCRAP EXPIRY — remove expired enemy drops
// Called each frame or on a timer
// ============================================================
function pruneExpiredScrap() {
    const now = Date.now();
    for (let i = scrapList.length - 1; i >= 0; i--) {
        const s = scrapList[i];
        if (s._expireAt && now > s._expireAt) {
            mapGrid[s.x][s.y] = TILE.WATER;
            scrapList.splice(i, 1);
        }
    }
}