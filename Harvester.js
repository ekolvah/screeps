const CreepBase = require('./CreepBase');

class Harvester extends CreepBase {
    handleIdleState() {
        const source = this.creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        if (source) {
            this.setState(CreepBase.STATE_MOVING);
            this.creep.memory.target = source.id;
        }
    }

    handleWorkingState() {
        const target = Game.getObjectById(this.creep.memory.target);
        if (!target) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (this.creep.harvest(target) === ERR_NOT_IN_RANGE) {
            this.setState(CreepBase.STATE_MOVING);
        }
    }
}

module.exports = Harvester; 