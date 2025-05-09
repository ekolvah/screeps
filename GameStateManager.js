const Config = require('./config');
const constants = require('./screeps_constants');

/**
 * Предоставляет унифицированный доступ к состоянию игры,
 * работая либо с реальными объектами Game/Memory, либо с загруженными из JSON.
 * 
 * @class GameStateManager
 * @description Реализует паттерн Proxy для абстракции доступа к игровым объектам.
 * Поддерживает два режима работы:
 * 1. Production - работа с реальными объектами Game/Memory
 * 2. Debug - работа с симулированными объектами из JSON
 */
class GameStateManager {
    /**
     * @constructor
     * @description Инициализирует менеджер состояния игры.
     * Создает прокси для Game и Memory в зависимости от режима работы.
     */
    constructor() {
        this.isDebugging = Config.DEBUG_MODE;
        this.state = null;

        if (this.isDebugging) {
            if (Config.DEBUG_GAME_STATE) {
                this.state = Config.DEBUG_GAME_STATE;
                this._buildSimulatedObjects(); // Создаем симулированные объекты с методами
                console.log(`GameStateManager: Initialized in DEBUG mode. Tick: ${this.state.tick}`);
            } else {
                console.error("GameStateManager: DEBUG_MODE is true, but DEBUG_GAME_STATE is not loaded. Falling back to production mode.");
                this.isDebugging = false; // Откатываемся, если данные не загружены
            }
        }

        if (!this.isDebugging) {
            console.log(`GameStateManager: Initialized in PRODUCTION mode. Tick: ${Game.time}`);
        }

        // Создаем прокси для Game и Memory
        this.game = this._createGameProxy();
        this.memory = this._createMemoryProxy();
    }

    /**
     * Создает прокси для объекта Memory, который автоматически делегирует вызовы
     * либо к реальному Memory, либо к симулированному объекту.
     * 
     * @private
     * @returns {Proxy} Прокси-объект для доступа к Memory
     * @description Реализует паттерн Proxy для абстракции доступа к памяти игры.
     * В режиме отладки использует данные из state.memory,
     * в production режиме - напрямую обращается к глобальному объекту Memory.
     */
    _createMemoryProxy() {
        const handler = {
            get: (target, prop) => {
                if (this.isDebugging) {
                    return this.state.memory[prop];
                } else {
                    return Memory[prop];
                }
            }
        };

        return new Proxy({}, handler);
    }

    /**
     * Создает прокси для объекта Game, который автоматически делегирует вызовы
     * либо к реальному Game, либо к симулированным объектам.
     * 
     * @private
     * @returns {Proxy} Прокси-объект для доступа к Game
     * @description Реализует паттерн Proxy для абстракции доступа к игровым объектам.
     * Поддерживает все основные операции с игровыми объектами:
     * - Доступ к крипам, спавнам, структурам
     * - Поиск объектов в комнатах
     * - Работа с ресурсами и строительством
     */
    _createGameProxy() {
        const handler = {
            get: (target, prop) => {
                if (this.isDebugging) {
                    switch (prop) {
                        case 'creeps':
                            const creeps = {};
                            for(const name in this.state.game.creeps) {
                                creeps[name] = this.simulatedObjects[this.state.game.creeps[name].id];
                            }
                            return creeps;
                        case 'spawns':
                            const spawns = {};
                            for(const name in this.state.game.spawns) {
                                spawns[name] = this.simulatedObjects[this.state.game.spawns[name].id];
                            }
                            return spawns;
                        case 'structures':
                            const structures = {};
                            for(const id in this.state.game.structures) {
                                structures[id] = this.simulatedObjects[id];
                            }
                            return structures;
                        case 'time':
                            return this.state.tick;
                        case 'rooms':
                            return this.state.game.rooms;
                        case 'getObjectById':
                            return (id) => this.simulatedObjects[id] || null;
                        case 'find':
                            return (roomName, findType, opts) => {
                                const room = this.state.game.rooms[roomName];
                                if (!room) return [];
                                return this._findSimulated(roomName, findType, opts);
                            };
                        default:
                            return this.state.game[prop];
                    }
                } else {
                    return Game[prop];
                }
            }
        };

        return new Proxy({}, handler);
    }

    /**
     * Находит симулированные объекты по типу и фильтру в указанной комнате.
     * 
     * @private
     * @param {string} roomName - Имя комнаты для поиска
     * @param {number} findType - Тип искомых объектов (FIND_* константы)
     * @param {Object} [opts] - Дополнительные опции поиска
     * @param {Function} [opts.filter] - Функция фильтрации результатов
     * @returns {Array} Массив найденных объектов
     * @description Имитирует работу Game.find() для симулированных объектов.
     * Поддерживает поиск:
     * - Враждебных крипов
     * - Источников энергии
     * - Выпавших ресурсов
     * - Строящихся объектов
     * - Структур
     * - Спавнов
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
            case FIND_DROPPED_RESOURCES:
                if (roomData.droppedResources) {
                    results.push(...roomData.droppedResources.map(r => this.simulatedObjects[r.id]));
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
            default:
                console.log(`GameStateManager._findSimulated: Unsupported findType: ${findType}`);
                return [];
        }

        // Применяем фильтр, если он есть
        // TODO в найденных обьектах нет типа и поэтому фильтрует их все? хотя в начале игры работает
        return filterFunc ? results.filter(filterFunc) : results;
    }

    /**
     * Вычисляет расстояние между двумя позициями.
     * 
     * @private
     * @param {RoomPosition} pos1 - Первая позиция
     * @param {RoomPosition} pos2 - Вторая позиция
     * @returns {number} Расстояние между позициями
     */
    _getRange(pos1, pos2) {
        return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
    }

    /**
     * Проверяет, находится ли одна позиция рядом с другой.
     * 
     * @private
     * @param {RoomPosition} pos1 - Первая позиция
     * @param {RoomPosition} pos2 - Вторая позиция
     * @returns {boolean} true если позиции рядом
     */
    _isNearTo(pos1, pos2) {
        return this._getRange(pos1, pos2) <= 1;
    }

    /**
     * Создает симулированные объекты с методами на основе данных из JSON.
     * 
     * @private
     * @description Создает полноценные объекты с методами для симуляции
     * на основе сырых данных из JSON. Поддерживает:
     * - Крипов с методами move, say, harvest и т.д.
     * - Структуры с методами transfer, store и т.д.
     * - Ресурсы и другие игровые объекты
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
                    isNearTo: (targetPosOrObject) => {
                        const targetPos = targetPosOrObject.pos || targetPosOrObject;
                        return this._isNearTo(creepData.pos, targetPos);
                    },
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
     * Создает симулированный объект хранилища.
     * 
     * @private
     * @param {Object} storeData - Данные хранилища
     * @returns {Object} Симулированный объект хранилища
     * @description Создает объект с методами для работы с хранилищем
     * (transfer, withdraw и т.д.) на основе данных из JSON.
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

    /**
     * Находит ближайший объект к указанной позиции.
     * 
     * @public
     * @param {RoomPosition} originPos - Позиция, от которой ищем
     * @param {number} findType - Тип искомых объектов (FIND_* константы)
     * @param {Object} [opts] - Дополнительные опции поиска
     * @param {Function} [opts.filter] - Функция фильтрации результатов
     * @returns {Object|null} Найденный объект или null
     */
    findClosestByRange(originPos, findType, opts) {
        if (this.isDebugging) {
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
        } else {
            // В продакшене используем RoomPosition.findClosestByRange
            return originPos.findClosestByRange(findType, opts);
        }
    }
}

// Экспортируем сам класс
module.exports = GameStateManager;