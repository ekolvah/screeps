const constants = require('./screeps_constants');

// Экспортируем функцию, принимающую gameStateManager
module.exports = function(gameStateManager) {
    // Обертка над GameStateManager
    const GameAPI = {
        getObjectById: (id) => gameStateManager.getObjectById(id),
        getTime: () => gameStateManager.getTime(),
        get creeps() { return gameStateManager.getCreeps(); },
        get rooms() { return gameStateManager.getRooms(); },
        get spawns() { return gameStateManager.getSpawns(); },
        get structures() { return gameStateManager.getStructures(); },
        get constructionSites() { return gameStateManager.getConstructionSites(); },
        get flags() { return gameStateManager.getFlags(); },
        get resources() { return gameStateManager.getResources(); },
        get market() { return gameStateManager.getMarket(); },
        get cpu() { return gameStateManager.getCpu(); },
        get map() { return gameStateManager.getMap(); },
        get shard() { return gameStateManager.getShard(); },
        get visual() { return gameStateManager.getVisual(); },
    };

    // Обертка над Memory
    const MemoryAPI = gameStateManager.getMemory();

    // Добавляем константы
    const ScreepsAPI = {
        ...constants,
        GameAPI,
        MemoryAPI
    };

    return ScreepsAPI;
}; 