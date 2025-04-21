class CreepBase {
    constructor(creep) {
        this.creep = creep;
    }

    // Состояния
    static STATE_IDLE = 'idle';
    static STATE_MOVING = 'moving';
    static STATE_WORKING = 'working';
    static STATE_RENEWING = 'renewing';
    static STATE_DYING = 'dying';

    // Базовые методы
    setState(newState) {
        this.creep.memory.state = newState;
        switch(newState) {
            case CreepBase.STATE_IDLE:
                this.creep.say('💤 ожидание');
                break;
            case CreepBase.STATE_MOVING:
                this.creep.say('🚶 движение');
                break;
            case CreepBase.STATE_WORKING:
                this.creep.say('⚡ работа');
                break;
            case CreepBase.STATE_RENEWING:
                this.creep.say('🔄 обновление');
                break;
            case CreepBase.STATE_DYING:
                this.creep.say('💀 смерть');
                break;
        }
    }

    handleState() {
        if (!this.creep.memory.state) {
            this.creep.memory.state = CreepBase.STATE_IDLE;
        }

        switch (this.creep.memory.state) {
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
        throw new Error('Method handleIdleState must be implemented');
    }

    handleMovingState() {
        const target = Game.getObjectById(this.creep.memory.target);
        if (!target) {
            delete this.creep.memory.target;
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (this.creep.pos.isNearTo(target)) {
            this.setState(CreepBase.STATE_WORKING);
        } else {
            const moveResult = this.creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
            if (moveResult === ERR_NO_PATH) {
                delete this.creep.memory.target;
                this.setState(CreepBase.STATE_IDLE);
            }
        }
    }

    handleWorkingState() {
        throw new Error('Method handleWorkingState must be implemented');
    }

    handleRenewingState() {
        const spawn = Game.spawns['Spawn1'];
        if (spawn) {
            if (spawn.renewCreep(this.creep) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(spawn);
            }
        } else {
            this.setState(CreepBase.STATE_IDLE);
        }
    }

    handleDyingState() {
        if (this.creep.ticksToLive < 50) {
            delete this.creep.memory.target;
            delete this.creep.memory.state;
            return;
        }
        
        const spawn = Game.spawns['Spawn1'];
        if (spawn) {
            if (spawn.renewCreep(this.creep) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(spawn);
            }
        } else {
            this.setState(CreepBase.STATE_IDLE);
        }
    }
}

module.exports = CreepBase; 