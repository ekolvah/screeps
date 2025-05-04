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

    // Состояния (остаются без изменений)
    static STATE_IDLE = 'idle';
    static STATE_MOVING = 'moving';
    static STATE_WORKING = 'working';
    static STATE_RENEWING = 'renewing'; // Добавим эти состояния, если они используются
    static STATE_DYING = 'dying';

    // Базовые методы
    setState(newState) {
        this.memory.state = newState; // Обращаемся к памяти через this.memory
        // В режиме дебага creep.say выведет в консоль через заглушку в GameStateManager
        switch(newState) {
             case CreepBase.STATE_IDLE:
                this.creep.say?.('💤 idle'); // Используем ?. на случай если say не реализован в симуляции
                break;
            case CreepBase.STATE_MOVING:
                this.creep.say?.('🚶 moving');
                break;
            case CreepBase.STATE_WORKING:
                this.creep.say?.('⚡ working');
                break;
            case CreepBase.STATE_RENEWING:
                this.creep.say?.('🔄 renewing');
                break;
            case CreepBase.STATE_DYING:
                this.creep.say?.('💀 dying');
                break;
        }
    }

    handleState() {
        // Проверяем, жив ли крип
        if (!this.creep || (!this.gameState.getCreeps()[this.creep.name] && !this.gameState.isDebugging)) {
            console.log(`Creep ${this.creep?.name || 'unknown'} not found, skipping state handling.`);
            return;
        }

        if (!this.memory.state) {
            this.memory.state = CreepBase.STATE_IDLE;
        }

        // Проверка на необходимость обновления или смерти
        if (this.creep.ticksToLive < 50 && this.memory.state !== CreepBase.STATE_DYING && this.memory.state !== CreepBase.STATE_RENEWING) {
             this.setState(CreepBase.STATE_DYING);
        } else if (this.memory.needsRenew && this.creep.ticksToLive < 1400 && this.memory.state !== CreepBase.STATE_RENEWING) {
             this.setState(CreepBase.STATE_RENEWING);
        }

        switch (this.memory.state) {
            case CreepBase.STATE_IDLE:
                this.handleIdleState();
                break;
            case CreepBase.STATE_MOVING:
                this.handleMovingState();
                break;
            case CreepBase.STATE_WORKING:
                this.handleWorkingState();
                break;
            case CreepBase.STATE_RENEWING:
                this.handleRenewingState();
                break;
            case CreepBase.STATE_DYING:
                this.handleDyingState();
                break;
            default:
                this.setState(CreepBase.STATE_IDLE);
        }
    }

    // Абстрактные методы, которые должны быть реализованы в дочерних классах
    handleIdleState() {
        console.log(`WARN: Method handleIdleState not implemented for ${this.creep.name} (${this.memory.role})`);
        // throw new Error('Method handleIdleState must be implemented');
    }

    handleMovingState() {
        const targetId = this.memory.target;
        if (!targetId) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        const target = this.gameState.game.getObjectById(targetId);
        if (!target) {
            console.log(`Creep ${this.creep.name}: Target ${targetId} not found. Going idle.`);
            delete this.memory.target;
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        // Используем симулированный isNearTo через creep.pos
        if (this.creep.pos.isNearTo(target.pos)) {
            // Достигли цели, переходим к работе
            // Сбрасываем путь, если он был в памяти (опционально)
            delete this.memory._move;
            this.setState(CreepBase.STATE_WORKING);
            // Сразу вызываем обработчик работы, чтобы не терять тик
            this.handleWorkingState();
        } else {
            // Используем симулированный moveTo
            const moveResult = this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            if (moveResult === ERR_NO_PATH) {
                // Путь не найден, возможно цель недостижима или заблокирована
                 console.log(`Creep ${this.creep.name}: No path to target ${targetId}. Going idle.`);
                delete this.memory.target;
                this.setState(CreepBase.STATE_IDLE);
            } else if (moveResult !== OK && moveResult !== ERR_TIRED) {
                 // Логируем другие ошибки движения
                 console.log(`Creep ${this.creep.name}: moveTo returned ${moveResult}`);
            }
        }
    }

    handleWorkingState() {
         console.log(`WARN: Method handleWorkingState not implemented for ${this.creep.name} (${this.memory.role})`);
        // throw new Error('Method handleWorkingState must be implemented');
    }

     handleRenewingState() {
        const spawn = this.gameState.getSpawn('Spawn1'); // Используем менеджер состояния
        if (spawn) {
            const renewResult = spawn.renewCreep(this.creep);
            if (renewResult === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(spawn); // Двигаемся к спавну
            } else if (renewResult === OK) {
                // Успешно обновляемся
                if (this.creep.ticksToLive >= 1450) { // Условие выхода из обновления
                    delete this.memory.needsRenew;
                    this.setState(CreepBase.STATE_IDLE); // Возвращаемся к обычной работе
                }
            } else if (renewResult === ERR_FULL) {
                 // Уже максимальное время жизни
                 delete this.memory.needsRenew;
                 this.setState(CreepBase.STATE_IDLE);
            } else if (renewResult !== ERR_BUSY) {
                 // Другая ошибка (например, не хватает энергии у спавна)
                 console.log(`Creep ${this.creep.name}: Renew failed with code ${renewResult}. Waiting.`);
                 // Можно добавить логику ожидания или перехода в idle
                 this.setState(CreepBase.STATE_IDLE); // Пока просто в idle
            }
        } else {
            console.log(`Creep ${this.creep.name}: Cannot renew, Spawn1 not found.`);
            this.setState(CreepBase.STATE_IDLE); // Не можем обновиться, идем в idle
        }
    }

    handleDyingState() {
        // В этом состоянии крип может попытаться передать ресурсы перед смертью
        // или просто дойти до спавна/контейнера, чтобы не мешать.
        // Сейчас - просто ждет смерти или пытается обновиться, если это возможно.

        if (this.creep.ticksToLive > 100) { // Если вдруг время жизни увеличилось (обновление?)
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        console.log(`Creep ${this.creep.name} is dying (${this.creep.ticksToLive} TTL). No specific action implemented.`);
        // Можно добавить логику сброса ресурсов в ближайший контейнер/спавн

        // Пытаться обновиться в состоянии DYING обычно не имеет смысла,
        // но если такая логика нужна, можно раскомментировать:
        /*
        const spawn = this.gameState.getSpawn('Spawn1');
        if (spawn && spawn.pos.isNearTo(this.creep.pos)) {
             spawn.renewCreep(this.creep); // Попытка обновиться, если рядом
        } else if (spawn) {
            this.creep.moveTo(spawn); // Или идем к спавну
        }
        */
         // По умолчанию крип просто доживает свои тики.
         // Память будет очищена в main.js после его смерти.
    }

     // Вспомогательный метод для поиска цели в текущей комнате крипа
    findClosestTarget(findType, opts) {
        // Используем findClosestByRange из симулированного pos
        return this.creep.pos.findClosestByRange(findType, opts);
    }
}

module.exports = CreepBase;