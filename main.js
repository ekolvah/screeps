// Подключаем конфигурацию и базовые модули
const Config = require('./config');
const Logger = require('./Logger');
const GameStateManager = require('./GameStateManager'); // Получаем экземпляр синглтона
const lodash = require('lodash');
const screeps = require('./screeps_api');
const { Game: GameAPI, Memory: MemoryAPI } = screeps;

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
// Теперь принимает GameStateManager для доступа к комнате в дебаге
function getBodyForRole(role, gameStateManager) {
     // Получаем доступную энергию (нужно для определения размера тела)
     // ВАЖНО: В дебаге это может быть неточным, если состояние комнаты не полное
     let energyAvailable = 300; // Значение по умолчанию
     if (!gameStateManager.isDebugging) {
         const room = GameAPI.rooms[GameAPI.spawns['Spawn1']?.pos.roomName]; // Пример для комнаты спавна
         if (room) {
             energyAvailable = room.energyAvailable;
         }
     } else {
         // В дебаге пытаемся получить из сохраненного состояния (если есть)
         const roomName = gameStateManager.getSpawn('Spawn1')?.pos.roomName;
         if (roomName && gameStateManager.state.game.rooms[roomName]) {
             energyAvailable = gameStateManager.state.game.rooms[roomName].energyAvailable;
         }
     }

     // Базовые тела (для ~300 энергии)
    let body = [screeps.WORK, screeps.CARRY, screeps.MOVE]; // По умолчанию
    switch (role) {
        case 'harvester':
            // Больше WORK для быстрой добычи
            if (energyAvailable >= 550) body = [screeps.WORK, screeps.WORK, screeps.WORK, screeps.CARRY, screeps.MOVE, screeps.MOVE]; // 550
            else if (energyAvailable >= 400) body = [screeps.WORK, screeps.WORK, screeps.CARRY, screeps.MOVE, screeps.MOVE]; // 400
            else body = [screeps.WORK, screeps.WORK, screeps.CARRY, screeps.MOVE]; // 300
            break;
        case 'builder':
             // Сбалансированный для работы и переноски
            if (energyAvailable >= 550) body = [screeps.WORK, screeps.WORK, screeps.CARRY, screeps.CARRY, screeps.MOVE, screeps.MOVE, screeps.MOVE]; // 550
            else if (energyAvailable >= 400) body = [screeps.WORK, screeps.WORK, screeps.CARRY, screeps.MOVE, screeps.MOVE]; // 400
             else body = [screeps.WORK, screeps.CARRY, screeps.MOVE, screeps.MOVE]; // 250
            break;
        case 'carrier':
            // Много CARRY и MOVE
            if (energyAvailable >= 600) body = [screeps.CARRY, screeps.CARRY, screeps.CARRY, screeps.CARRY, screeps.MOVE, screeps.MOVE, screeps.MOVE, screeps.MOVE]; // 600
            else if (energyAvailable >= 400) body = [screeps.CARRY, screeps.CARRY, screeps.CARRY, screeps.MOVE, screeps.MOVE, screeps.MOVE]; // 450
            else body = [screeps.CARRY, screeps.CARRY, screeps.MOVE, screeps.MOVE]; // 300
            break;
        case 'attacker':
            // ATTACK и MOVE, возможно TOUGH
            if (energyAvailable >= 390) body = [screeps.TOUGH, screeps.TOUGH, screeps.ATTACK, screeps.ATTACK, screeps.MOVE, screeps.MOVE]; // 380
            else if (energyAvailable >= 260) body = [screeps.ATTACK, screeps.ATTACK, screeps.MOVE, screeps.MOVE]; // 260
            else body = [screeps.ATTACK, screeps.MOVE]; // 130
            break;
        default:
             body = [screeps.WORK, screeps.CARRY, screeps.MOVE]; // 200
    }
     console.log(`getBodyForRole: Role=${role}, Energy=${energyAvailable}, Body=[${body}]`);
    return body;
}


// Функция управления спавном крипов
function manageSpawn(gameStateManager) {
    const spawn = gameStateManager.getSpawn('Spawn1'); // Получаем спавн через менеджер
    if (!spawn || spawn.spawning) { // Если спавна нет или он занят
        return;
    }

    // Получаем крипов через менеджер состояния
    const creepsInGame = gameStateManager.getCreeps();
    const creepsByRole = lodash.groupBy(creepsInGame, 'memory.role'); // Используем память из gameState

    // Задаем желаемое количество крипов для каждой роли
    const desiredCreeps = {
        harvester: 2,
        carrier: 2, // Добавим больше носильщиков
        builder: 1,
        attacker: 0, // Атакеры по умолчанию не нужны
        // Можно добавить 'upgrader' и т.д.
    };

     // Определяем приоритет спавна
    const spawnPriority = ['harvester', 'carrier', 'builder', 'attacker'];
    let newRole = null;

    for (const role of spawnPriority) {
         const currentCount = (creepsByRole[role] || []).length;
         if (currentCount < desiredCreeps[role]) {
             newRole = role;
             break; // Нашли первую роль, которой не хватает крипов
         }
    }

    if (newRole) {
         const body = getBodyForRole(newRole, gameStateManager);
         const name = `${newRole}-${gameStateManager.getTime()}`; // Используем время из менеджера
         const memory = { memory: { role: newRole, state: CreepBase.STATE_IDLE } }; // Начальное состояние IDLE

         // Проверяем достаточность энергии (в дебаге это может быть не точно)
         const bodyCost = body.reduce((cost, part) => cost + (BODYPART_COST[part] || 0), 0);

         let energyAvailable = 300; // Default
         if (!gameStateManager.isDebugging) {
            energyAvailable = GameAPI.rooms[spawn.pos.roomName].energyAvailable;
         } else if (gameStateManager.state.game.rooms[spawn.pos.roomName]) {
            energyAvailable = gameStateManager.state.game.rooms[spawn.pos.roomName].energyAvailable;
         }


         if (energyAvailable >= bodyCost) {
             const spawnResult = spawn.spawnCreep(body, name, memory);

             if (spawnResult === OK) {
                 console.log(`Spawning new ${newRole}: ${name}`);
                 // В режиме дебага, спавн не произойдет по-настоящему,
                 // но мы можем добавить информацию в лог или состояние симуляции, если нужно
                 if (gameStateManager.isDebugging) {
                      console.log(`DEBUG: Simulated spawn command for ${name} returned OK.`);
                 }
             } else {
                 // Логируем ошибку только если это не ERR_NOT_ENOUGH_ENERGY (она ожидаема)
                 if (spawnResult !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log(`Failed to spawn ${newRole}: ${name}. Error: ${spawnResult}`);
                 }
                 // В дебаге спавн может вернуть ошибку, если симуляция это предусматривает
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
    
    // 1. Инициализация менеджера состояния (определяет режим работы)
    console.log("Initializing GameStateManager...");
    // Используем существующий экземпляр синглтона
    const gameStateManager = GameStateManager;
    
    console.log("GameStateManager initialized. Debug mode:", gameStateManager.isDebugging);
    if (gameStateManager.isDebugging) {
        console.log("Debug state loaded:", !!gameStateManager.state);
        console.log("Current tick:", gameStateManager.getTime());
        console.log("Available creeps:", Object.keys(gameStateManager.getCreeps()));
    }

    // 2. Логирование состояния (только в продакшене)
    if (!gameStateManager.isDebugging && GameAPI.time % 5 === 0) { // Логируем не каждый тик для экономии CPU
        console.log(`Tick ${GameAPI.time}:`);
        Logger.logState(GameAPI, MemoryAPI); // Используем реальные Game/Memory для лога
    }

    // 3. Очистка памяти мертвых крипов (используем Memory из gameStateManager)
    const memory = gameStateManager.getMemory();
    if (!gameStateManager.isDebugging) { // Очищаем только в продакшене
        for (const name in memory.creeps) {
            // Проверяем через Game, так как gameStateManager в проде не хранит список живых крипов
            if (!GameAPI.creeps[name]) {
                console.log('Clearing non-existing creep memory:', name);
                delete memory.creeps[name];
            }
        }
    } else {
        // В дебаге можно сверить память с загруженным состоянием, но обычно это не нужно
    }


    // 4. Обработка всех крипов (используем крипов из gameStateManager)
    const creeps = gameStateManager.getCreeps();
    for (const name in creeps) {
        const creep = creeps[name]; // Получаем реальный или симулированный объект

        // Проверяем наличие роли (в дебаге роль должна быть из JSON)
        if (!creep.memory || !creep.memory.role) {
             console.log(`Creep ${name} has no role in memory. Assigning default 'harvester'.`);
             // В проде присваиваем, в дебаге это может быть индикатором проблемы в логе
             if (!gameStateManager.isDebugging) {
                 creep.memory = creep.memory || {}; // Убедимся что память есть
                 creep.memory.role = 'harvester'; // Роль по умолчанию
                 creep.memory.state = CreepBase.STATE_IDLE;
             } else {
                 continue; // В дебаге пропускаем крипов без роли в логе
             }
        }

        const CreepRoleClass = roleMap[creep.memory.role];
        if (CreepRoleClass) {
            try {
                // Передаем симулированный или реальный крип и менеджер состояния
                const creepManager = new CreepRoleClass(creep, gameStateManager);
                creepManager.handleState(); // Запускаем логику крипа
            } catch (error) {
                 console.log(`Error running state for creep ${name} (${creep.memory.role}): ${error.stack || error}`);
                  // В проде можно добавить Game.notify
            }
        } else {
            console.log(`Unknown role: ${creep.memory.role} for creep ${name}`);
        }
    }

    // 5. Управление спавном (только в продакшене или для симуляции спавна в дебаге)
    // Вызываем manageSpawn только если мы не в режиме "однотикового" дебага
    // или если хотим симулировать и логику спавна.
    // Сейчас вызываем всегда, чтобы видеть решения спавна.
    try {
        manageSpawn(gameStateManager);
    } catch (error) {
         console.log(`Error during spawn management: ${error.stack || error}`);
    }

     // 6. Вывод информации о CPU (полезно в проде)
    if (!gameStateManager.isDebugging && GameAPI.time % 10 === 0) {
        console.log(`CPU Used: ${GameAPI.cpu.getUsed().toFixed(2)} / ${GameAPI.cpu.limit}. Bucket: ${GameAPI.cpu.bucket}`);
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