// Имитация глобальных объектов Screeps
global.Game = {
    creeps: {},
    spawns: {
        'Spawn1': {
            name: 'Spawn1',
            room: {
                name: 'sim',
                energyAvailable: 300,
                energyCapacityAvailable: 300,
                find: (type) => {
                    switch(type) {
                        case FIND_SOURCES:
                            return [
                                {
                                    id: '3f9154f885ef2661aef26b15',
                                    pos: { x: 35, y: 20 },
                                    energy: 3000,
                                    energyCapacity: 3000,
                                    ticksToRegeneration: 0
                                },
                                {
                                    id: '25a36edd813563585f3f97b1',
                                    pos: { x: 43, y: 44 },
                                    energy: 3000,
                                    energyCapacity: 3000,
                                    ticksToRegeneration: 0
                                },
                                {
                                    id: '3c7fa0a936b6389e580a84e9',
                                    pos: { x: 6, y: 44 },
                                    energy: 3000,
                                    energyCapacity: 3000,
                                    ticksToRegeneration: 0
                                },
                                {
                                    id: 'd41828b63236efe45a5d54ca',
                                    pos: { x: 35, y: 2 },
                                    energy: 3000,
                                    energyCapacity: 3000,
                                    ticksToRegeneration: 0
                                }
                            ];
                        case FIND_MY_SPAWNS:
                            return [Game.spawns['Spawn1']];
                        case FIND_MY_CREEPS:
                            return Object.values(Game.creeps);
                        case FIND_STRUCTURES:
                            return [
                                {
                                    id: '4c76733ee259a0ff64627886',
                                    structureType: 'keeperLair',
                                    pos: { x: 3, y: 47 },
                                    hits: undefined,
                                    hitsMax: undefined
                                },
                                {
                                    id: 'dd24f3ae1b017c3fcf9f8fdd',
                                    structureType: 'controller',
                                    pos: { x: 22, y: 15 },
                                    hits: undefined,
                                    hitsMax: undefined
                                },
                                {
                                    id: '4cfdfba2197586a54f0a3cd5',
                                    structureType: 'spawn',
                                    pos: { x: 21, y: 26 },
                                    hits: 5000,
                                    hitsMax: 5000
                                }
                            ];
                        default:
                            return [];
                    }
                },
                getTerrain: () => ({
                    get: (x, y) => {
                        const terrain = worldData.terrain.find(t => t.x === x && t.y === y);
                        return terrain ? terrain.type : 'plain';
                    }
                }),
                visual: {
                    text: (text, x, y, style) => {
                        console.log(`Визуальный текст: ${text} в позиции (${x},${y})`);
                    }
                }
            },
            pos: { x: 21, y: 26 },
            spawning: null,
            spawnCreep: (body, name) => {
                console.log(`Создание крипа ${name} с телом ${body}`);
                return OK;
            }
        }
    }
};

// Имитация памяти игры
global.Memory = {
    creeps: {}
};

// Имитация констант Screeps
global.WORK = 'work';
global.CARRY = 'carry';
global.MOVE = 'move';
global.OK = 0;
global.ERR_NOT_IN_RANGE = -9;
global.ERR_BUSY = -4;
global.ERR_FULL = -8;
global.FIND_SOURCES = 105;
global.FIND_STRUCTURES = 107;
global.FIND_MY_CREEPS = 102;
global.FIND_MY_SPAWNS = 103;
global.RESOURCE_ENERGY = 'energy';
global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_ROAD = 'road';
global.STRUCTURE_WALL = 'constructedWall';
global.STRUCTURE_RAMPART = 'rampart';
global.STRUCTURE_KEEPER_LAIR = 'keeperLair';
global.STRUCTURE_PORTAL = 'portal';
global.STRUCTURE_CONTROLLER = 'controller';
global.STRUCTURE_LINK = 'link';
global.STRUCTURE_STORAGE = 'storage';
global.STRUCTURE_TOWER = 'tower';
global.STRUCTURE_OBSERVER = 'observer';
global.STRUCTURE_POWER_BANK = 'powerBank';
global.STRUCTURE_POWER_SPAWN = 'powerSpawn';
global.STRUCTURE_EXTRACTOR = 'extractor';
global.STRUCTURE_LAB = 'lab';
global.STRUCTURE_TERMINAL = 'terminal';
global.STRUCTURE_CONTAINER = 'container';
global.STRUCTURE_NUKER = 'nuker';

// Имитация методов крипа
class MockCreep {
    constructor(name, body) {
        this.name = name;
        this.body = body;
        this.store = {
            getFreeCapacity: () => 50,
            getUsedCapacity: () => 0
        };
        this.pos = { x: 0, y: 0 };
        this.memory = { harvesting: true };
        this.room = Game.spawns['Spawn1'].room;
    }

    say(message) {
        console.log(`${this.name} говорит: ${message}`);
    }

    moveTo(target, options) {
        console.log(`${this.name} движется к ${target.id || target.name} в позицию (${target.pos.x},${target.pos.y})`);
        return OK;
    }

    harvest(source) {
        console.log(`${this.name} добывает энергию из источника ${source.id}`);
        return OK;
    }

    transfer(target, resourceType) {
        console.log(`${this.name} передает ${resourceType} в ${target.name}`);
        return OK;
    }
}

// Функция для создания крипа в игре
function createCreep(body, name) {
    Game.creeps[name] = new MockCreep(name, body);
    return OK;
}

// Модифицируем spawnCreep для использования нашей функции создания
Game.spawns['Spawn1'].spawnCreep = (body, name) => {
    console.log(`Создание крипа ${name} с телом ${body}`);
    return createCreep(body, name);
};

// Загружаем и выполняем основной скрипт
const main = require('./main.js');

// Имитация игрового цикла
function testLoop() {
    console.log('--- Начало тестового цикла ---');
    main.loop();
    console.log('--- Конец тестового цикла ---');
}

// Запускаем тестовый цикл
testLoop();