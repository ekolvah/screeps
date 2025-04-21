const CreepBase = require('./CreepBase');
const Harvester = require('./Harvester');
const Builder = require('./Builder');
const Carrier = require('./Carrier');
const Attacker = require('./Attacker');

// Основной цикл игры
module.exports.loop = function() {
    // Очистка памяти мертвых крипов
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Очищаем память мертвого крипа:', name);
        }
    }

    // Обработка всех крипов
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        
        // Устанавливаем роль, если она не задана
        if (!creep.memory.role) {
            creep.memory.role = 'harvester'; // Устанавливаем роль по умолчанию
            console.log(`Устанавливаем роль по умолчанию для крипа ${name}: harvester`);
        }

        let creepManager;

        // Создаем соответствующий менеджер в зависимости от роли крипа
        switch (creep.memory.role) {
            case 'harvester':
                creepManager = new Harvester(creep);
                break;
            case 'builder':
                creepManager = new Builder(creep);
                break;
            case 'carrier':
                creepManager = new Carrier(creep);
                break;
            case 'attacker':
                creepManager = new Attacker(creep);
                break;
            default:
                console.log(`Неизвестная роль крипа: ${creep.memory.role}`);
                continue;
        }

        // Обрабатываем состояние крипа
        creepManager.handleState();
    }

    // Управление спавном крипов
    manageSpawn();
};

// Функция управления спавном крипов
function manageSpawn() {
    const spawn = Game.spawns['Spawn1'];
    if (!spawn) return;

    // Подсчет крипов по ролям
    const creeps = _.groupBy(Game.creeps, 'memory.role');
    const harvesters = (creeps.harvester || []).length;
    const builders = (creeps.builder || []).length;
    const carriers = (creeps.carrier || []).length;
    const attackers = (creeps.attacker || []).length;

    // Создаем нового крипа, если есть свободная энергия
    if (spawn.store[RESOURCE_ENERGY] >= 300) {
        let newRole;
        
        // Определяем, какого крипа нужно создать
        if (harvesters < 2) {
            newRole = 'harvester';
        } else if (builders < 1) {
            newRole = 'builder';
        } else if (carriers < 2) {
            newRole = 'carrier';
        } else if (attackers < 1) {
            newRole = 'attacker';
        }

        if (newRole) {
            const body = getBodyForRole(newRole);
            const name = `${newRole}-${Game.time}`;
            
            spawn.spawnCreep(body, name, {
                memory: { role: newRole }
            });
        }
    }
}

// Функция определения тела крипа в зависимости от роли
function getBodyForRole(role) {
    switch (role) {
        case 'harvester':
            return [WORK, CARRY, MOVE];
        case 'builder':
            return [WORK, CARRY, MOVE];
        case 'carrier':
            return [CARRY, CARRY, MOVE, MOVE];
        case 'attacker':
            return [ATTACK, MOVE];
        default:
            return [WORK, CARRY, MOVE];
    }
}