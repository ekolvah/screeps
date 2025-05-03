const { DEBUG_MODE } = require('./config');

const constants = {
    // Коды возврата
    OK: 0,
    ERR_NOT_OWNER: -1,
    ERR_NO_PATH: -2,
    ERR_NAME_EXISTS: -3,
    ERR_BUSY: -4,
    ERR_NOT_FOUND: -5,
    ERR_NOT_ENOUGH_ENERGY: -6,
    ERR_NOT_ENOUGH_RESOURCES: -6,
    ERR_INVALID_TARGET: -7,
    ERR_FULL: -8,
    ERR_NOT_IN_RANGE: -9,
    ERR_INVALID_ARGS: -10,
    ERR_TIRED: -11,
    ERR_NO_BODYPART: -12,
    ERR_NOT_ENOUGH_EXTENSIONS: -6,
    ERR_RCL_NOT_ENOUGH: -14,
    ERR_GCL_NOT_ENOUGH: -15,

    // Части тела
    MOVE: 'move',
    WORK: 'work',
    CARRY: 'carry',
    ATTACK: 'attack',
    RANGED_ATTACK: 'ranged_attack',
    TOUGH: 'tough',
    HEAL: 'heal',
    CLAIM: 'claim',

    // FIND_* константы
    FIND_EXIT_TOP: 1,
    FIND_EXIT_RIGHT: 3,
    FIND_EXIT_BOTTOM: 5,
    FIND_EXIT_LEFT: 7,
    FIND_EXIT: 10,
    FIND_CREEPS: 101,
    FIND_MY_CREEPS: 102,
    FIND_HOSTILE_CREEPS: 103,
    FIND_SOURCES_ACTIVE: 104,
    FIND_SOURCES: 105,
    FIND_DROPPED_RESOURCES: 106,
    FIND_STRUCTURES: 107,
    FIND_MY_STRUCTURES: 108,
    FIND_HOSTILE_STRUCTURES: 109,
    FIND_FLAGS: 110,
    FIND_CONSTRUCTION_SITES: 111,
    FIND_MY_SPAWNS: 112,
    FIND_HOSTILE_SPAWNS: 113,
    FIND_MY_CONSTRUCTION_SITES: 114,
    FIND_HOSTILE_CONSTRUCTION_SITES: 115,
    FIND_MINERALS: 116,
    FIND_NUKES: 117,
    FIND_TOMBSTONES: 118,
    FIND_POWER_CREEPS: 119,
    FIND_MY_POWER_CREEPS: 120,
    FIND_HOSTILE_POWER_CREEPS: 121,
    FIND_DEPOSITS: 122,
    FIND_RUINS: 123,

    // Ресурсы
    RESOURCE_ENERGY: 'energy',
    RESOURCE_POWER: 'power',
    RESOURCE_HYDROGEN: 'H',
    RESOURCE_OXYGEN: 'O',
    RESOURCE_UTRIUM: 'U',
    RESOURCE_LEMERGIUM: 'L',
    RESOURCE_KEANIUM: 'K',
    RESOURCE_ZYNTHIUM: 'Z',
    RESOURCE_CATALYST: 'X',
    RESOURCE_GHODIUM: 'G',

    // Цвета
    COLOR_RED: 1,
    COLOR_PURPLE: 2,
    COLOR_BLUE: 3,
    COLOR_CYAN: 4,
    COLOR_GREEN: 5,
    COLOR_YELLOW: 6,
    COLOR_ORANGE: 7,
    COLOR_BROWN: 8,
    COLOR_GREY: 9,
    COLOR_WHITE: 10,

    // Добавьте этот объект:
    BODYPART_COST: {
        move: 50,
        work: 100,
        attack: 80,
        carry: 50,
        heal: 250,
        ranged_attack: 150,
        tough: 10,
        claim: 600
    },

    // Типы структур
    STRUCTURE_SPAWN: 'spawn',
    STRUCTURE_EXTENSION: 'extension',
    STRUCTURE_ROAD: 'road',
    STRUCTURE_WALL: 'constructedWall',
    STRUCTURE_RAMPART: 'rampart',
    STRUCTURE_KEEPER_LAIR: 'keeperLair',
    STRUCTURE_PORTAL: 'portal',
    STRUCTURE_CONTROLLER: 'controller',
    STRUCTURE_LINK: 'link',
    STRUCTURE_STORAGE: 'storage',
    STRUCTURE_TOWER: 'tower',
    STRUCTURE_OBSERVER: 'observer',
    STRUCTURE_POWER_BANK: 'powerBank',
    STRUCTURE_POWER_SPAWN: 'powerSpawn',
    STRUCTURE_EXTRACTOR: 'extractor',
    STRUCTURE_LAB: 'lab',
    STRUCTURE_TERMINAL: 'terminal',
    STRUCTURE_CONTAINER: 'container',
    STRUCTURE_NUKER: 'nuker',
    STRUCTURE_FACTORY: 'factory',
    STRUCTURE_INVADER_CORE: 'invaderCore',
};

if (DEBUG_MODE) {
    // Только для Node.js (debug-режим)
    for (const [key, value] of Object.entries(constants)) {
        if (typeof global[key] === 'undefined') {
            global[key] = value;
        }
    }
}

module.exports = constants; 