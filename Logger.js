/**
 * Простой логгер для вывода состояния игры в JSON.
 */
class Logger {
    /**
     * Собирает текущее состояние игры и выводит его в консоль как JSON.
     * Вызывается только в режиме продакшена.
     * @param {object} gameInstance - Глобальный объект Game.
     * @param {object} memoryInstance - Глобальный объект Memory.
     */
    static logState(gameInstance, memoryInstance) {
        const state = {
            timestamp: new Date().toISOString(),
            tick: gameInstance.time,
            memory: this._safeCloneMemory(memoryInstance),
            game: {
                time: gameInstance.time,
                cpu: gameInstance.cpu, // Добавим информацию о CPU
                // Копируем только нужные части Game объекта
                creeps: {},
                structures: {},
                spawns: {},
                rooms: {}, // Добавим базовую информацию о комнатах
            }
        };

        // Копируем данные крипов
        for (const name in gameInstance.creeps) {
            const creep = gameInstance.creeps[name];
            // Клонируем только необходимые свойства, чтобы избежать сложных объектов
            state.game.creeps[name] = {
                id: creep.id,
                name: creep.name,
                pos: creep.pos,
                hits: creep.hits,
                hitsMax: creep.hitsMax,
                my: creep.my,
                owner: creep.owner,
                role: creep.memory.role, // Дублируем роль для удобства
                spawning: creep.spawning,
                store: creep.store,
                ticksToLive: creep.ticksToLive,
                body: creep.body.map(part => part.type) // Копируем только типы частей тела
                // Не копируем 'memory' здесь, т.к. оно уже есть в state.memory.creeps[name]
                // Не копируем методы
            };
        }

        // Копируем данные структур
        for (const id in gameInstance.structures) {
             const structure = gameInstance.structures[id];
             state.game.structures[id] = {
                id: structure.id,
                pos: structure.pos,
                hits: structure.hits,
                hitsMax: structure.hitsMax,
                my: structure.my,
                owner: structure.owner,
                structureType: structure.structureType,
                // Добавляем специфичные для типа свойства, если они нужны
                ...(structure.store && { store: structure.store }),
                ...(structure.progress !== undefined && { progress: structure.progress }),
                ...(structure.progressTotal !== undefined && { progressTotal: structure.progressTotal }),
             };
        }

         // Копируем данные спавнов
         for (const name in gameInstance.spawns) {
            const spawn = gameInstance.spawns[name];
            state.game.spawns[name] = {
                id: spawn.id,
                name: spawn.name,
                pos: spawn.pos,
                hits: spawn.hits,
                hitsMax: spawn.hitsMax,
                my: spawn.my,
                owner: spawn.owner,
                structureType: spawn.structureType,
                spawning: spawn.spawning ? { // Копируем информацию о спавне крипа
                    name: spawn.spawning.name,
                    needTime: spawn.spawning.needTime,
                    remainingTime: spawn.spawning.remainingTime
                } : null,
                store: spawn.store,
            };
         }

        // Копируем базовую информацию о видимых комнатах
        for (const roomName in gameInstance.rooms) {
            const room = gameInstance.rooms[roomName];
            state.game.rooms[roomName] = {
                name: room.name,
                energyAvailable: room.energyAvailable,
                energyCapacityAvailable: room.energyCapacityAvailable,
                // Добавляем контроллер, если есть
                controller: room.controller ? {
                    id: room.controller.id,
                    pos: room.controller.pos,
                    level: room.controller.level,
                    progress: room.controller.progress,
                    progressTotal: room.controller.progressTotal,
                    owner: room.controller.owner,
                    reservation: room.controller.reservation,
                    safeMode: room.controller.safeMode,
                    safeModeAvailable: room.controller.safeModeAvailable,
                    safeModeCooldown: room.controller.safeModeCooldown,
                    ticksToDowngrade: room.controller.ticksToDowngrade,
                    upgradeBlocked: room.controller.upgradeBlocked,
                    my: room.controller.my
                } : undefined,
                // Добавляем хранилище, если есть
                storage: room.storage ? {
                    id: room.storage.id,
                    pos: room.storage.pos,
                    store: room.storage.store,
                    structureType: room.storage.structureType,
                } : undefined,
                // Можно добавить FIND_SOURCES, FIND_CONSTRUCTION_SITES и т.д., если нужно
                 sources: room.find(FIND_SOURCES).map(s => ({ id: s.id, pos: s.pos, energy: s.energy, energyCapacity: s.energyCapacity })),
                 constructionSites: room.find(FIND_CONSTRUCTION_SITES).map(cs => ({ id: cs.id, pos: cs.pos, progress: cs.progress, progressTotal: cs.progressTotal, structureType: cs.structureType, my: cs.my })),
                 hostileCreeps: room.find(FIND_HOSTILE_CREEPS).map(hc => ({ id: hc.id, pos: hc.pos, owner: hc.owner, body: hc.body.map(p => p.type) })),
            };
        }


        // Выводим одной строкой JSON с префиксом
        console.log(`DEBUG_STATE_JSON: ${JSON.stringify(state)}`);
    }

    /**
     * Безопасно клонирует объект памяти.
     * @private
     * @param {object} memory - Объект памяти для клонирования
     * @returns {object} Клонированный объект памяти
     */
    static _safeCloneMemory(memory) {
        if (!memory) return {};
        
        const result = {};
        
        // Копируем creeps
        if (memory.creeps) {
            result.creeps = {};
            for (const name in memory.creeps) {
                result.creeps[name] = { ...memory.creeps[name] };
            }
        }

        // Копируем остальные поля памяти
        for (const key in memory) {
            if (key !== 'creeps' && typeof memory[key] !== 'function') {
                result[key] = memory[key];
            }
        }

        return result;
    }
}

module.exports = Logger;