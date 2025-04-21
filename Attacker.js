const CreepBase = require('./CreepBase');

class Attacker extends CreepBase {
    handleIdleState() {
        const enemy = this.creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (enemy) {
            this.setState(CreepBase.STATE_MOVING);
            this.creep.memory.target = enemy.id;
        }
    }

    handleWorkingState() {
        const target = Game.getObjectById(this.creep.memory.target);
        if (!target) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (this.creep.attack(target) === ERR_NOT_IN_RANGE) {
            this.setState(CreepBase.STATE_MOVING);
        }
    }
}

module.exports = Attacker; 