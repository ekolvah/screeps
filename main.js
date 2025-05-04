// Подключаем конфигурацию и базовые модули
const Config = require('./config');
const Logger = require('./Logger');
const GameStateManager = require('./GameStateManager');
const lodash = require('lodash');
const constants = require('./screeps_constants');

// Подключаем базовый класс и роли
const CreepBase = require('./CreepBase');
const Harvester = require('./Harvester');
const Builder = require('./Builder');
const Carrier = require('./Carrier');
const Attacker = require('./Attacker');

// Карта ролей для удобного создания менеджеров
const roleMap = {
    harvester: Harvester,
    builder: Builder,
    carrier: Carrier,
    attacker: Attacker,
};

// Функция определения тела крипа в зависимости от роли и доступной энергии
function getBodyForRole(role, gameStateManager) {
     // Получаем доступную энергию (нужно для определения размера тела)
     // ВАЖНО: В дебаге это может быть неточным, если состояние комнаты не полное
     let energyAvailable = 300; // Значение по умолчанию
     if (!gameStateManager.isDebugging) {
         const room = gameStateManager.getRooms()[gameStateManager.game.spawns['Spawn1']?.pos.roomName];
         if (room) {
             energyAvailable = room.energyAvailable;
         }
     } else {
         // В дебаге пытаемся получить из сохраненного состояния (если есть)
         const roomName = gameStateManager.game.spawns['Spawn1']?.pos.roomName;
         if (roomName && gameStateManager.state.game.rooms[roomName]) {
             energyAvailable = gameStateManager.state.game.rooms[roomName].energyAvailable;
         }
     }

     // Базовые тела (для ~300 энергии)
    let body = [constants.WORK, constants.CARRY, constants.MOVE]; // По умолчанию
    switch (role) {
        case 'harvester':
            // Больше WORK для быстрой добычи
            if (energyAvailable >= 550) body = [constants.WORK, constants.WORK, constants.WORK, constants.CARRY, constants.MOVE, constants.MOVE]; // 550
            else if (energyAvailable >= 400) body = [constants.WORK, constants.WORK, constants.CARRY, constants.MOVE, constants.MOVE]; // 400
            else body = [constants.WORK, constants.WORK, constants.CARRY, constants.MOVE]; // 300
            break;
        case 'builder':
             // Сбалансированный для работы и переноски
            if (energyAvailable >= 550) body = [constants.WORK, constants.WORK, constants.CARRY, constants.CARRY, constants.MOVE, constants.MOVE, constants.MOVE]; // 550
            else if (energyAvailable >= 400) body = [constants.WORK, constants.WORK, constants.CARRY, constants.MOVE, constants.MOVE]; // 400
             else body = [constants.WORK, constants.CARRY, constants.MOVE, constants.MOVE]; // 250
            break;
        case 'carrier':
            // Много CARRY и MOVE
            if (energyAvailable >= 600) body = [constants.CARRY, constants.CARRY, constants.CARRY, constants.CARRY, constants.MOVE, constants.MOVE, constants.MOVE, constants.MOVE]; // 600
            else if (energyAvailable >= 400) body = [constants.CARRY, constants.CARRY, constants.CARRY, constants.MOVE, constants.MOVE, constants.MOVE]; // 450
            else body = [constants.CARRY, constants.CARRY, constants.MOVE, constants.MOVE]; // 300
            break;
        case 'attacker':
            // ATTACK и MOVE, возможно TOUGH
            if (energyAvailable >= 390) body = [constants.TOUGH, constants.TOUGH, constants.ATTACK, constants.ATTACK, constants.MOVE, constants.MOVE]; // 380
            else if (energyAvailable >= 260) body = [constants.ATTACK, constants.ATTACK, constants.MOVE, constants.MOVE]; // 260
            else body = [constants.ATTACK, constants.MOVE]; // 130
            break;
        default:
             body = [constants.WORK, constants.CARRY, constants.MOVE]; // 200
    }
     console.log(`getBodyForRole: Role=${role}, Energy=${energyAvailable}, Body=[${body}]`);
    return body;
}

// Функция управления спавном крипов
function manageSpawn(gameStateManager) {
    const spawn = gameStateManager.game.spawns['Spawn1'];
    if (!spawn || spawn.spawning) {
        return;
    }

    // Получаем крипов через менеджер состояния
    const creepsInGame = gameStateManager.getCreeps();
    const creepsByRole = lodash.groupBy(creepsInGame, 'memory.role');

    // Задаем желаемое количество крипов для каждой роли
    const desiredCreeps = {
        harvester: 2,
        carrier: 2,
        builder: 1,
        attacker: 0,
    };

     // Определяем приоритет спавна
    const spawnPriority = ['harvester', 'carrier', 'builder', 'attacker'];
    let newRole = null;

    for (const role of spawnPriority) {
         const currentCount = (creepsByRole[role] || []).length;
         if (currentCount < desiredCreeps[role]) {
             newRole = role;
             break;
         }
    }

    if (newRole) {
         const body = getBodyForRole(newRole, gameStateManager);
         const name = `${newRole}-${gameStateManager.getTime()}`;
         const memory = { memory: { role: newRole, state: CreepBase.STATE_IDLE } };

         // Проверяем достаточность энергии
         const bodyCost = body.reduce((cost, part) => cost + (BODYPART_COST[part] || 0), 0);

         let energyAvailable = 300;
         if (!gameStateManager.isDebugging) {
            energyAvailable = gameStateManager.getRooms()[spawn.pos.roomName].energyAvailable;
         } else if (gameStateManager.state.game.rooms[spawn.pos.roomName]) {
            energyAvailable = gameStateManager.state.game.rooms[spawn.pos.roomName].energyAvailable;
         }

         if (energyAvailable >= bodyCost) {
             const spawnResult = spawn.spawnCreep(body, name, memory);

             if (spawnResult === OK) {
                 console.log(`Spawning new ${newRole}: ${name}`);
                 if (gameStateManager.isDebugging) {
                      console.log(`DEBUG: Simulated spawn command for ${name} returned OK.`);
                 }
             } else {
                 if (spawnResult !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log(`Failed to spawn ${newRole}: ${name}. Error: ${spawnResult}`);
                 }
                 if (gameStateManager.isDebugging) {
                     console.log(`DEBUG: Simulated spawn command for ${name} returned ${spawnResult}.`);
                  }
             }
         } else {
              console.log(`Need ${bodyCost} energy to spawn ${newRole}, but only ${energyAvailable} available.`);
         }
    }
}

// Основная функция игрового цикла
function gameLoop() {
    console.log("Starting game loop...");
    
    // 1. Инициализация менеджера состояния
    console.log("Initializing GameStateManager...");
    const gameStateManager = new GameStateManager();
    
    console.log("GameStateManager initialized. Debug mode:", gameStateManager.isDebugging);
    if (gameStateManager.isDebugging) {
        console.log("Debug state loaded:", !!gameStateManager.state);
        console.log("Current tick:", gameStateManager.getTime());
        console.log("Available creeps:", Object.keys(gameStateManager.getCreeps()));
    }

    // 2. Логирование состояния (только в продакшене)
    if (!gameStateManager.isDebugging) { 
        console.log(`Tick ${gameStateManager.getTime()}:`);
        Logger.logState(gameStateManager, gameStateManager.getMemory());
    }

    // 3. Очистка памяти мертвых крипов
    const memory = gameStateManager.getMemory();
    if (!gameStateManager.isDebugging) {
        for (const name in memory.creeps) {
            if (!gameStateManager.getCreeps()[name]) {
                console.log('Clearing non-existing creep memory:', name);
                delete memory.creeps[name];
            }
        }
    }

    // 4. Обработка всех крипов
    const creeps = gameStateManager.getCreeps();
    for (const name in creeps) {
        const creep = creeps[name];

        if (!creep.memory || !creep.memory.role) {
             console.log(`Creep ${name} has no role in memory. Assigning default 'harvester'.`);
             if (!gameStateManager.isDebugging) {
                 creep.memory = creep.memory || {};
                 creep.memory.role = 'harvester';
                 creep.memory.state = CreepBase.STATE_IDLE;
             } else {
                 continue;
             }
        }

        const CreepRoleClass = roleMap[creep.memory.role];
        if (CreepRoleClass) {
            try {
                const creepManager = new CreepRoleClass(creep, gameStateManager);
                creepManager.handleState();
            } catch (error) {
                 console.log(`Error running state for creep ${name} (${creep.memory.role}): ${error.stack || error}`);
            }
        } else {
            console.log(`Unknown role: ${creep.memory.role} for creep ${name}`);
        }
    }

    // 5. Управление спавном
    try {
        manageSpawn(gameStateManager);
    } catch (error) {
         console.log(`Error during spawn management: ${error.stack || error}`);
    }

     // 6. Вывод информации о CPU
    if (!gameStateManager.isDebugging && gameStateManager.getTime() % 10 === 0) {
        const cpu = gameStateManager.getCpu();
        console.log(`CPU Used: ${cpu.getUsed().toFixed(2)} / ${cpu.limit}. Bucket: ${cpu.bucket}`);
    } else if (gameStateManager.isDebugging) {
        console.log(`DEBUG: End of Tick ${gameStateManager.getTime()}`);
    }
}

// Экспортируем функцию loop по-разному для продакшена и отладки
if (Config.DEBUG_MODE) {
    // В режиме отладки экспортируем как обычную функцию и сразу запускаем
    module.exports.loop = gameLoop;
    console.log("Debug mode detected, running first game loop...");
    gameLoop();
} else {
    // В продакшене экспортируем как анонимную функцию (стандартный формат Screeps)
    module.exports.loop = function() {
        gameLoop();
    };
}