const CreepBase = require('./CreepBase');

class Carrier extends CreepBase {
    handleIdleState() {
        const target = this.findEnergyTarget();
        if (target) {
            this.setState(CreepBase.STATE_MOVING);
            this.creep.memory.target = target.id;
        }
    }

    handleWorkingState() {
        const target = Game.getObjectById(this.creep.memory.target);
        if (!target) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (this.creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.setState(CreepBase.STATE_MOVING);
        }
    }

    findEnergyTarget() {
        // Ищем хранилище с неполным запасом энергии
        const storage = this.creep.room.storage;
        if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            return storage;
        }

        // Ищем контроллер для улучшения
        const controller = this.creep.room.controller;
        if (controller && controller.progress < controller.progressTotal) {
            return controller;
        }

        // Ищем спавнеры и расширения с неполным запасом энергии
        const structures = this.creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_EXTENSION) &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        return structures[0];
    }
}

module.exports = Carrier; 