/**
 * Базовый класс для всех типов крипов.
 * Реализует паттерн State для управления поведением крипа.
 * 
 * @class CreepBase
 * @description Базовый класс, от которого наследуются все типы крипов.
 * Реализует общую логику поведения и управления состоянием.
 * Использует паттерн State для переключения между различными режимами работы.
 */
class CreepBase {
    /**
     * @param {Creep | object} creep Реальный или симулированный объект крипа.
     * @param {GameStateManager} gameStateManager Менеджер состояния игры.
     */
    constructor(creep, gameStateManager) {
        this.creep = creep;
        this.gameState = gameStateManager;
        this.memory = this.creep.memory;
    }

    /**
     * Константы состояний крипа.
     * @enum {string}
     * @readonly
     */
    static STATES = {
        /** Крип находится в режиме ожидания */
        STATE_IDLE: 'idle',
        /** Крип перемещается к цели */
        STATE_MOVING: 'moving',
        /** Крип выполняет основное действие (сбор, строительство и т.д.) */
        STATE_WORKING: 'working',
        /** Крип возвращается на базу */
        STATE_RETURNING: 'returning',
        /** Крип атакует цель */
        STATE_ATTACKING: 'attacking',
        /** Крип защищает позицию */
        STATE_DEFENDING: 'defending'
    };

    /**
     * Обрабатывает текущее состояние крипа.
     * 
     * @private
     * @description Основной метод обработки состояния крипа.
     * Вызывает соответствующий обработчик в зависимости от текущего состояния.
     * Реализует паттерн State для управления поведением.
     */
    handleState() {
        // Проверяем, жив ли крип
        if (!this.creep || (!this.gameState.game.creeps[this.creep.name] && !this.gameState.isDebugging)) {
            console.log(`Creep ${this.creep?.name || 'unknown'} not found, skipping state handling.`);
            return;
        }

        if (!this.memory.state) {
            this.memory.state = CreepBase.STATES.STATE_IDLE;
        }

        // Проверка на необходимость обновления или смерти
        if (this.creep.ticksToLive < 50 && this.memory.state !== CreepBase.STATES.STATE_DYING && this.memory.state !== CreepBase.STATES.STATE_RENEWING) {
             this.setState(CreepBase.STATES.STATE_DYING);
        } else if (this.memory.needsRenew && this.creep.ticksToLive < 1400 && this.memory.state !== CreepBase.STATES.STATE_RENEWING) {
             this.setState(CreepBase.STATES.STATE_RENEWING);
        }

        switch (this.memory.state) {
            case CreepBase.STATES.STATE_IDLE:
                this.handleIdleState();
                break;
            case CreepBase.STATES.STATE_MOVING:
                this.handleMovingState();
                break;
            case CreepBase.STATES.STATE_WORKING:
                this.handleWorkingState();
                break;
            case CreepBase.STATES.STATE_RENEWING:
                this.handleRenewingState();
                break;
            case CreepBase.STATES.STATE_DYING:
                this.handleDyingState();
                break;
            default:
                this.setState(CreepBase.STATES.STATE_IDLE);
        }
    }

    /**
     * Обрабатывает состояние ожидания.
     * 
     * @private
     * @description Определяет следующее действие крипа в состоянии ожидания.
     * Может переключить крипа в состояние движения или работы.
     */
    handleIdleState() {
        console.log(`WARN: Method handleIdleState not implemented for ${this.creep.name} (${this.memory.role})`);
        // throw new Error('Method handleIdleState must be implemented');
    }

    /**
     * Обрабатывает состояние движения.
     * 
     * @private
     * @param {RoomPosition} targetPos - Целевая позиция
     * @description Управляет движением крипа к целевой позиции.
     * Переключает состояние на работу при достижении цели.
     */
    handleMovingState() {
        const targetId = this.memory.target;
        if (!targetId) {
            this.setState(CreepBase.STATES.STATE_IDLE);
            return;
        }

        const target = this.gameState.game.getObjectById(targetId);
        if (!target) {
            console.log(`Creep ${this.creep.name}: Target ${targetId} not found. Going idle.`);
            delete this.memory.target;
            this.setState(CreepBase.STATES.STATE_IDLE);
            return;
        }

        // Используем симулированный isNearTo через creep.pos
        if (this.creep.pos.isNearTo(target.pos)) {
            // Достигли цели, переходим к работе
            // Сбрасываем путь, если он был в памяти (опционально)
            delete this.memory._move;
            this.setState(CreepBase.STATES.STATE_WORKING);
            // Сразу вызываем обработчик работы, чтобы не терять тик
            this.handleWorkingState();
        } else {
            // Используем симулированный moveTo
            const moveResult = this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            if (moveResult === ERR_NO_PATH) {
                // Путь не найден, возможно цель недостижима или заблокирована
                 console.log(`Creep ${this.creep.name}: No path to target ${targetId}. Going idle.`);
                delete this.memory.target;
                this.setState(CreepBase.STATES.STATE_IDLE);
            } else if (moveResult !== OK && moveResult !== ERR_TIRED) {
                 // Логируем другие ошибки движения
                 console.log(`Creep ${this.creep.name}: moveTo returned ${moveResult}`);
            }
        }
    }

    /**
     * Устанавливает новое состояние крипа.
     * 
     * @param {string} newState - Новое состояние из CreepBase.STATES
     * @description Изменяет состояние крипа и обновляет его память.
     * Используется для переключения между различными режимами работы.
     */
    setState(newState) {
        this.memory.state = newState; // Обращаемся к памяти через this.memory
        // В режиме дебага creep.say выведет в консоль через заглушку в GameStateManager
        switch(newState) {
             case CreepBase.STATES.STATE_IDLE:
                this.creep.say?.('💤 idle'); // Используем ?. на случай если say не реализован в симуляции
                break;
            case CreepBase.STATES.STATE_MOVING:
                this.creep.say?.('🚶 moving');
                break;
            case CreepBase.STATES.STATE_WORKING:
                this.creep.say?.('⚡ working');
                break;
            case CreepBase.STATES.STATE_RENEWING:
                this.creep.say?.('🔄 renewing');
                break;
            case CreepBase.STATES.STATE_DYING:
                this.creep.say?.('💀 dying');
                break;
        }
    }

    /**
     * Получает текущее состояние крипа.
     * 
     * @returns {string} Текущее состояние крипа
     * @description Возвращает текущее состояние крипа из его памяти.
     */
    getState() {
        return this.memory.state;
    }

    // Вспомогательный метод для поиска цели в текущей комнате крипа
    findClosestTarget(findType, opts) {
        // Используем findClosestByRange через gameState.game
        return this.gameState.game.findClosestByRange(this.creep.pos, findType, opts);
    }
}


module.exports = CreepBase;