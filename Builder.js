const CreepBase = require('./CreepBase');

class Builder extends CreepBase {
    handleIdleState() {
        const constructionSite = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (constructionSite) {
            this.setState(CreepBase.STATE_MOVING);
            this.creep.memory.target = constructionSite.id;
        }
    }

    handleWorkingState() {
        const target = Game.getObjectById(this.creep.memory.target);
        if (!target) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (this.creep.build(target) === ERR_NOT_IN_RANGE) {
            this.setState(CreepBase.STATE_MOVING);
        }
    }
}

module.exports = Builder; 