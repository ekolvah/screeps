const constants = require('./screeps_constants');
const gameStateManager = require('./GameStateManager');

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
    get time() { return gameStateManager.getTime(); }
};

// Обертка над Memory
const MemoryAPI = {
    get creeps() { return gameStateManager.getMemory().creeps; },
    get flags() { return gameStateManager.getMemory().flags; },
    get rooms() { return gameStateManager.getMemory().rooms; },
    get spawns() { return gameStateManager.getMemory().spawns; }
};

// Обертка над PathFinder
const PathFinderAPI = {
    search: (origin, goal, opts) => gameStateManager.getPathFinder().search(origin, goal, opts),
    use: (isEnabled) => gameStateManager.getPathFinder().use(isEnabled)
};

// Экспортируем все константы и методы
module.exports = {
    // Константы
    ...constants,
    
    // Глобальные объекты
    Game: GameAPI,
    Memory: MemoryAPI,
    PathFinder: PathFinderAPI,
    
    // Вспомогательные методы
    getObjectById: GameAPI.getObjectById,
    getTime: GameAPI.getTime,
    
    // Методы для работы с крипами
    getCreeps: () => GameAPI.creeps,
    getCreep: (name) => GameAPI.creeps[name],
    
    // Методы для работы со спавнами
    getSpawns: () => GameAPI.spawns,
    getSpawn: (name) => GameAPI.spawns[name],
    
    // Методы для работы с комнатами
    getRooms: () => GameAPI.rooms,
    getRoom: (name) => GameAPI.rooms[name],
    
    // Методы для работы со структурами
    getStructures: () => GameAPI.structures,
    getStructure: (id) => GameAPI.getObjectById(id),
    
    // Методы для работы с ресурсами
    getResources: () => GameAPI.resources,
    getResource: (id) => GameAPI.getObjectById(id),
    
    // Методы для работы с флагами
    getFlags: () => GameAPI.flags,
    getFlag: (name) => GameAPI.flags[name],
    
    // Методы для работы с памятью
    getMemory: () => MemoryAPI,
    getCreepMemory: (name) => MemoryAPI.creeps[name],
    getFlagMemory: (name) => MemoryAPI.flags[name],
    getRoomMemory: (name) => MemoryAPI.rooms[name],
    getSpawnMemory: (name) => MemoryAPI.spawns[name]
}; 