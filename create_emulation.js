module.exports.loop = function() {
    // Получаем сохраненные данные о мире
    const worldData = Memory.worldData;
    if (!worldData) {
        console.log('Данные о мире не найдены. Запустите сначала collect_world_data.js');
        return;
    }

    // Создаем шаблон для test.js
    let testJsContent = `// Имитация глобальных объектов Screeps
global.Game = {
    creeps: {},
    spawns: {
        'Spawn1': {
            name: 'Spawn1',
            room: {
                name: '${worldData.name}',
                energyAvailable: ${worldData.energyAvailable},
                energyCapacityAvailable: ${worldData.energyCapacityAvailable},
                find: (type) => {
                    switch(type) {
                        case FIND_SOURCES:
                            return [
                                ${worldData.sources.map(source => `{
                                    id: '${source.id}',
                                    pos: { x: ${source.pos.x}, y: ${source.pos.y} },
                                    energy: ${source.energy},
                                    energyCapacity: ${source.energyCapacity},
                                    ticksToRegeneration: 0
                                }`).join(',\n                                ')}
                            ];
                        case FIND_MY_SPAWNS:
                            return [Game.spawns['Spawn1']];
                        case FIND_MY_CREEPS:
                            return Object.values(Game.creeps);
                        case FIND_STRUCTURES:
                            return [
                                ${worldData.structures.map(structure => `{
                                    id: '${structure.id}',
                                    structureType: '${structure.type}',
                                    pos: { x: ${structure.pos.x}, y: ${structure.pos.y} },
                                    hits: ${structure.hits},
                                    hitsMax: ${structure.hitsMax}
                                }`).join(',\n                                ')}
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
                        console.log(\`Визуальный текст: \${text} в позиции (\${x},\${y})\`);
                    }
                }
            },
            pos: { x: ${worldData.structures.find(s => s.type === STRUCTURE_SPAWN).pos.x}, y: ${worldData.structures.find(s => s.type === STRUCTURE_SPAWN).pos.y} },
            spawning: null,
            spawnCreep: (body, name) => {
                console.log(\`Создание крипа \${name} с телом \${body}\`);
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
        console.log(\`\${this.name} говорит: \${message}\`);
    }

    moveTo(target, options) {
        console.log(\`\${this.name} движется к \${target.id || target.name} в позицию (\${target.pos.x},\${target.pos.y})\`);
        return OK;
    }

    harvest(source) {
        console.log(\`\${this.name} добывает энергию из источника \${source.id}\`);
        return OK;
    }

    transfer(target, resourceType) {
        console.log(\`\${this.name} передает \${resourceType} в \${target.name}\`);
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
    console.log(\`Создание крипа \${name} с телом \${body}\`);
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
testLoop();`;

    // Выводим содержимое в консоль
    console.log('Содержимое test.js:');
    console.log(testJsContent);

    // Сохраняем в Memory для копирования
    Memory.testJsContent = testJsContent;
}; 