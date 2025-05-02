const Config = require('./config');
const constants = require('./screeps_constants');

/**
 * Предоставляет унифицированный доступ к состоянию игры,
 * работая либо с реальными объектами Game/Memory, либо с загруженными из JSON.
 */
class GameStateManager {
    constructor() {
        this.isDebugging = Config.DEBUG_MODE;
        this.state = null;

        if (this.isDebugging) {
            if (Config.DEBUG_GAME_STATE) {
                this.state = Config.DEBUG_GAME_STATE;
                this._buildSimulatedObjects(); // Создаем симулированные объекты с методами
                
                // Создаем симулированный глобальный объект Game
                global.GameAPI = {
                    getObjectById: (id) => this.getObjectById(id),
                    getTime: () => this.getTime(),
                    creeps: this.getCreeps(),
                    rooms: this.state.game.rooms,
                    spawns: this.getSpawns(),
                    structures: this.getStructures(),
                    constructionSites: this.getConstructionSites(),
                    flags: this.getFlags(),
                    resources: this.getResources(),
                    market: this.getMarket(),
                    cpu: this.getCpu(),
                    map: this.getMap(),
                    shard: this.getShard(),
                    visual: this.getVisual()
                };
                
                console.log(`GameStateManager: Initialized in DEBUG mode. Tick: ${this.getTime()}`);
            } else {
                console.error("GameStateManager: DEBUG_MODE is true, but DEBUG_GAME_STATE is not loaded. Falling back to production mode.");
                this.isDebugging = false; // Откатываемся, если данные не загружены
            }
        }

        if (!this.isDebugging) {
            // В продакшн-режиме используем глобальный объект Game
            global.GameAPI = Game;
            console.log(`GameStateManager: Initialized in PRODUCTION mode. Tick: ${Game.time}`);
        }
    }

    /**
     * Возвращает объект крипа по ID.
     * @param {string} id
     * @returns {Creep | object | null} Реальный Creep или симулированный объект крипа.
     */
    getObjectById(id) {
        if (this.isDebugging) {
            // Ищем в симулированных объектах
            return this.simulatedObjects[id] || null;
        } else {
            return GameAPI.getObjectById(id);
        }
    }

    /**
     * Возвращает объект Memory.
     * @returns {object} Реальный Memory или загруженный объект.
     */
    getMemory() {
        return this.isDebugging ? this.state.memory : Memory;
    }

    /**
     * Возвращает объект спавна по имени.
     * @param {string} name
     * @returns {StructureSpawn | object | null}
     */
    getSpawn(name = 'Spawn1') {
         if (this.isDebugging) {
            // Ищем спавн по имени в загруженных данных
            const spawnData = this.state.game.spawns[name];
            return spawnData ? this.simulatedObjects[spawnData.id] : null;
        } else {
            return GameAPI.spawns[name];
        }
    }

    /**
     * Возвращает текущий тик игры.
     * @returns {number}
     */
    getTime() {
        if (this.isDebugging) {
            return this.state.tick;
        } else {
            return GameAPI.time;
        }
    }

    /**
     * Возвращает все объекты крипов.
     * @returns {{ [creepName: string]: Creep | object }} Словарь крипов.
     */
    getCreeps() {
        if (this.isDebugging) {
            // Возвращаем только симулированные объекты крипов
            const creeps = {};
            for(const name in this.state.game.creeps) {
                creeps[name] = this.simulatedObjects[this.state.game.creeps[name].id];
            }
            return creeps;
        } else {
            return GameAPI.creeps;
        }
    }

    /**
     * Возвращает все объекты структур.
     * @returns {{ [structureId: string]: Structure | object }} Словарь структур.
      */
     getStructures() {
        if (this.isDebugging) {
            // Возвращаем только симулированные объекты структур
            const structures = {};
            for(const id in this.state.game.structures) {
                structures[id] = this.simulatedObjects[id];
            }
            return structures;
        } else {
            return GameAPI.structures;
        }
    }

    /**
     * Возвращает все объекты спавнов.
      * @returns {{ [spawnName: string]: StructureSpawn | object }} Словарь спавнов.
     */
     getSpawns() {
        if (this.isDebugging) {
            // Возвращаем только симулированные объекты спавнов
             const spawns = {};
            for(const name in this.state.game.spawns) {
                spawns[name] = this.simulatedObjects[this.state.game.spawns[name].id];
            }
            return spawns;
        } else {
            return GameAPI.spawns;
        }
    }

    getConstructionSites() {
        if (this.isDebugging) {
            return this.state.game.constructionSites;
        } else {
            return GameAPI.constructionSites;
        }
    }

    getFlags() {
        if (this.isDebugging) {
            return this.state.game.flags;
        } else {
            return GameAPI.flags;
        }
    }

    getResources() {
        if (this.isDebugging) {
            return this.state.game.resources;
        } else {
            return GameAPI.resources;
        }
    }

    getMarket() {
        if (this.isDebugging) {
            return this.state.game.market;
        } else {
            return GameAPI.market;
        }
    }

    getCpu() {
        if (this.isDebugging) {
            return this.state.game.cpu;
        } else {
            return GameAPI.cpu;
        }
    }

    getMap() {
        if (this.isDebugging) {
            return this.state.game.map;
        } else {
            return GameAPI.map;
        }
    }

    getShard() {
        if (this.isDebugging) {
            return this.state.game.shard;
        } else {
            return GameAPI.shard;
        }
    }

    getVisual() {
        if (this.isDebugging) {
            return this.state.game.visual;
        } else {
            return GameAPI.visual;
        }
    }

    getPathFinder() {
        if (this.isDebugging) {
            return this.state.game.pathFinder;
        } else {
            return PathFinder;
        }
    }

    getRooms() {
        if (this.isDebugging) {
            return this.state.game.rooms;
        } else {
            return GameAPI.rooms;
        }
    }

    // --- Методы поиска (Симуляция) ---

    /**
     * Симулирует findClosestByRange для отладки.
     * @param {RoomPosition} originPos Позиция, от которой ищем.
     * @param {number} findType FIND_* константа.
     * @param {object} [opts] Опции (например, filter).
     * @returns {object | null} Симулированный ближайший объект или null.
     */
    findClosestByRange(originPos, findType, opts) {
        if (!this.isDebugging) {
            // В продакшене вызываем реальный метод комнаты
            // Важно: Нужен доступ к объекту комнаты. Предположим, он доступен или получается из originPos
            const room = Game.rooms[originPos.roomName];
            return room ? room.findClosestByRange(findType, opts) : null;
             // ИЛИ если метод вызывается от creep.pos:
             // const creep = Game.getObjectById(originPos._simulatedCreepId); // Нужен способ связать pos с крипом
             // return creep ? creep.pos.findClosestByRange(findType, opts) : null;
             // Для простоты, пока оставим вызов через Game.rooms
        }

        const candidates = this._findSimulated(originPos.roomName, findType, opts);
        if (!candidates.length) {
            return null;
        }

        let closest = null;
        let minRange = Infinity;

        for (const candidate of candidates) {
            const range = this._getRange(originPos, candidate.pos);
            if (range < minRange) {
                minRange = range;
                closest = candidate;
            }
        }
        return closest;
    }

     /**
     * Симулирует find для отладки.
     * @param {string} roomName Имя комнаты для поиска.
     * @param {number} findType FIND_* константа.
     * @param {object} [opts] Опции (например, filter).
     * @returns {Array<object>} Массив симулированных объектов.
     */
    find(roomName, findType, opts) {
         if (!this.isDebugging) {
            const room = Game.rooms[roomName];
            return room ? room.find(findType, opts) : [];
        }
        return this._findSimulated(roomName, findType, opts);
    }

    // --- Приватные методы симуляции ---

    /**
     * Находит симулированные объекты по типу и фильтру в указанной комнате.
     * @private
     */
    _findSimulated(roomName, findType, opts) {
        const results = [];
        const roomData = this.state.game.rooms[roomName];
        if (!roomData) return []; // Комната не найдена в состоянии

        const filterFunc = opts?.filter;

        switch (findType) {
            case FIND_HOSTILE_CREEPS:
                if (roomData.hostileCreeps) {
                    results.push(...roomData.hostileCreeps.map(hc => this.simulatedObjects[hc.id]));
                }
                break;
            case FIND_SOURCES_ACTIVE: // Приближение: считаем все источники активными
            case FIND_SOURCES:
                 if (roomData.sources) {
                    results.push(...roomData.sources.map(s => this.simulatedObjects[s.id]));
                 }
                 break;
            case FIND_CONSTRUCTION_SITES:
                 if (roomData.constructionSites) {
                     results.push(...roomData.constructionSites.map(cs => this.simulatedObjects[cs.id]));
                 }
                break;
            case FIND_STRUCTURES:
                 for (const id in this.state.game.structures) {
                     const structure = this.simulatedObjects[id];
                     if (structure && structure.pos.roomName === roomName) {
                         results.push(structure);
                     }
                 }
                break;
             case FIND_MY_SPAWNS: // Добавляем поиск спавнов
                 for (const name in this.state.game.spawns) {
                     const spawn = this.simulatedObjects[this.state.game.spawns[name].id];
                     if (spawn && spawn.pos.roomName === roomName && spawn.my) {
                         results.push(spawn);
                     }
                 }
                 break;
            // Добавить другие FIND_* константы по мере необходимости
            default:
                console.log(`GameStateManager._findSimulated: Unsupported findType: ${findType}`);
                return [];
        }

        // Применяем фильтр, если он есть
        return filterFunc ? results.filter(filterFunc) : results;
    }


    /**
     * Рассчитывает расстояние между двумя позициями (простая эвристика).
     * @private
     */
    _getRange(pos1, pos2) {
        if (pos1.roomName !== pos2.roomName) {
            return Infinity; // В разных комнатах
        }
        // Используем Chebyshev distance (расстояние по сетке)
        return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
    }

     /**
     * Рассчитывает, находятся ли позиции рядом.
     * @private
     */
    _isNearTo(pos1, pos2) {
        return this._getRange(pos1, pos2) <= 1;
    }

    /**
     * Создает "объекты-заглушки" для всех сущностей из загруженного состояния,
     * добавляя им необходимые методы для симуляции API Screeps.
     * @private
     */
    _buildSimulatedObjects() {
        this.simulatedObjects = {};

        // Обработка крипов
        for (const name in this.state.game.creeps) {
            const creepData = this.state.game.creeps[name];
            const creepMemory = this.state.memory.creeps[name] || {}; // Получаем память крипа
            this.simulatedObjects[creepData.id] = {
                ...creepData, // Копируем все данные из лога
                memory: creepMemory, // Добавляем память
                // --- Симулированные Методы Creep ---
                attack: (target) => {
                    if (!target) return ERR_INVALID_TARGET;
                    return this._isNearTo(creepData.pos, target.pos) ? OK : ERR_NOT_IN_RANGE;
                },
                build: (target) => {
                     if (!target) return ERR_INVALID_TARGET;
                     // В дебаге просто проверяем расстояние
                     return this._isNearTo(creepData.pos, target.pos) ? OK : ERR_NOT_IN_RANGE;
                },
                harvest: (target) => {
                     if (!target) return ERR_INVALID_TARGET;
                     return this._isNearTo(creepData.pos, target.pos) ? OK : ERR_NOT_IN_RANGE;
                },
                transfer: (target, resourceType, amount) => {
                     if (!target || !resourceType) return ERR_INVALID_TARGET;
                     return this._isNearTo(creepData.pos, target.pos) ? OK : ERR_NOT_IN_RANGE;
                },
                moveTo: (target, opts) => {
                    return target ? constants.OK : constants.ERR_INVALID_TARGET;
                },
                say: (message) => {
                     console.log(`DEBUG: Creep ${creepData.name} says: "${message}"`);
                },
                // --- Симулированные Свойства Creep ---
                 pos: { // Добавляем симулированный объект pos
                    ...creepData.pos, // Копируем x, y, roomName
                    // _simulatedCreepId: creepData.id, // Сохраняем ID для возможной связи
                    isNearTo: (targetPosOrObject) => {
                        const targetPos = targetPosOrObject.pos || targetPosOrObject;
                        return this._isNearTo(creepData.pos, targetPos);
                    },
                    findClosestByRange: (findType, opts) => {
                        // Делегируем основному методу менеджера
                        return this.findClosestByRange(creepData.pos, findType, opts);
                    },
                    // Можно добавить findInRange, если используется
                },
                store: this._simulateStore(creepData.store), // Симулируем объект store
            };
        }

        // Обработка структур (включая спавны, т.к. они наследуются от Structure)
         for (const id in this.state.game.structures) {
             const structData = this.state.game.structures[id];
             this.simulatedObjects[id] = {
                ...structData,
                // --- Симулированные Свойства/Методы Structure ---
                 pos: { ...structData.pos }, // Простой объект pos
                 store: this._simulateStore(structData.store),
             };
         }

        // Обработка спавнов (добавляем специфичные методы)
        for (const name in this.state.game.spawns) {
             const spawnData = this.state.game.spawns[name];
             const spawnObject = this.simulatedObjects[spawnData.id]; // Получаем уже созданный объект структуры
             if (spawnObject) {
                 Object.assign(spawnObject, {
                     // --- Симулированные Методы Spawn ---
                     spawnCreep: (body, name, opts) => {
                         console.log(`DEBUG: Attempting to spawn ${name} with body [${body}]`);
                         // Проверяем энергию (упрощенно)
                         const bodyCost = body.reduce((cost, part) => cost + (BODYPART_COST[part] || 0), 0);
                         if (!spawnObject.spawning && spawnObject.store[RESOURCE_ENERGY] >= bodyCost) {
                            console.log(`DEBUG: Spawn ${spawnData.name}: OK (enough energy)`);
                             return OK; // В дебаге просто говорим ОК, если хватает энергии и не занят
                         } else if (spawnObject.spawning) {
                            console.log(`DEBUG: Spawn ${spawnData.name}: BUSY`);
                             return ERR_BUSY;
                         } else {
                             console.log(`DEBUG: Spawn ${spawnData.name}: NOT_ENOUGH_ENERGY (cost: ${bodyCost}, available: ${spawnObject.store[RESOURCE_ENERGY]})`);
                             return ERR_NOT_ENOUGH_ENERGY;
                         }
                     },
                     renewCreep: (creep) => {
                        const targetCreep = this.simulatedObjects[creep.id];
                        if (!targetCreep) return ERR_INVALID_TARGET;
                        return this._isNearTo(spawnData.pos, targetCreep.pos) ? OK : ERR_NOT_IN_RANGE;
                     },
                 });
             }
         }

         // Обработка источников
         for (const roomName in this.state.game.rooms) {
            const roomData = this.state.game.rooms[roomName];
             if(roomData.sources) {
                 roomData.sources.forEach(sourceData => {
                     this.simulatedObjects[sourceData.id] = {
                        ...sourceData,
                        pos: { ...sourceData.pos }
                     };
                 });
             }
             // Обработка стройплощадок
             if(roomData.constructionSites) {
                 roomData.constructionSites.forEach(csData => {
                     this.simulatedObjects[csData.id] = {
                         ...csData,
                         pos: { ...csData.pos }
                     };
                 });
             }
            // Обработка вражеских крипов
             if(roomData.hostileCreeps) {
                 roomData.hostileCreeps.forEach(hcData => {
                     this.simulatedObjects[hcData.id] = {
                         ...hcData,
                         pos: { ...hcData.pos }
                     };
                 });
             }
             // Обработка контроллера
             if (roomData.controller) {
                 const controllerData = roomData.controller;
                  this.simulatedObjects[controllerData.id] = {
                         ...controllerData,
                         pos: { ...controllerData.pos }
                     };
             }
              // Обработка хранилища
             if (roomData.storage) {
                 const storageData = roomData.storage;
                 this.simulatedObjects[storageData.id] = {
                         ...storageData,
                         pos: { ...storageData.pos },
                         store: this._simulateStore(storageData.store)
                     };
             }
         }

         console.log(`GameStateManager: Built ${Object.keys(this.simulatedObjects).length} simulated objects.`);
    }

    /**
     * Создает симулированный объект store с методами getCapacity, getUsedCapacity, getFreeCapacity.
     * @private
     */
    _simulateStore(storeData) {
        if (!storeData) return undefined; // Если данных store нет

        const simulatedStore = { ...storeData }; // Копируем ресурсы { energy: 100, ... }

        simulatedStore.getCapacity = (resource = RESOURCE_ENERGY) => {
            // ВАЖНО: Данные о capacity должны быть в логе! Если их нет, возвращаем null или примерное значение.
            // Предположим, что для простоты capacity всегда для энергии и равно сумме ресурсов + free (если есть)
            // Это неточно, но лучше чем ничего без данных о capacity в логе.
            // Правильнее было бы добавить 'storeCapacity' в лог для структур/крипов.
             const capacity = storeData.energyCapacity || (storeData[resource] !== undefined ? (storeData[resource] + (storeData.freeCapacity || 0)) : 0); // Очень грубое приближение
             //console.log(`DEBUG: getCapacity(${resource}) called. Data: ${JSON.stringify(storeData)}, Calculated capacity: ${capacity}`);
            return capacity > 0 ? capacity : 2000; // Заглушка, если не удалось определить
        };

        simulatedStore.getUsedCapacity = (resource = RESOURCE_ENERGY) => {
            return simulatedStore[resource] || 0;
        };

        simulatedStore.getFreeCapacity = (resource = RESOURCE_ENERGY) => {
            const capacity = simulatedStore.getCapacity(resource);
            const used = simulatedStore.getUsedCapacity(resource);
            return capacity !== null ? capacity - used : 0; // Если capacity неизвестно, считаем что места нет
        };

        return simulatedStore;
    }
}

// Экспортируем сам класс, а не экземпляр
module.exports = GameStateManager;