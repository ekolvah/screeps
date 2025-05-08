const CreepBase = require('./CreepBase');

class Attacker extends CreepBase {
    handleIdleState() {
        // Используем вспомогательный метод базового класса для поиска
        const enemy = this.findClosestTarget(FIND_HOSTILE_CREEPS);
        if (enemy) {
            console.log(`Attacker ${this.creep.name}: Found enemy ${enemy.id} at ${enemy.pos}`);
            this.memory.target = enemy.id;
            this.setState(CreepBase.STATE_MOVING); // Сначала идем к цели
            this.handleMovingState(); // Вызываем сразу, чтобы не терять тик
        } else {
             // Нет врагов, можно патрулировать или стоять на месте
             this.creep.say?.('🛡️ No targets');
        }
    }

    handleWorkingState() {
        const targetId = this.memory.target;
        if (!targetId) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }
        const target = this.gameState.game.getObjectById(targetId);
        if (!target || target.hits === 0) { // Проверяем, что цель еще существует и жива
             console.log(`Attacker ${this.creep.name}: Target ${targetId} lost or destroyed. Going idle.`);
            delete this.memory.target;
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        // Атакуем, если в радиусе действия
        const attackResult = this.creep.attack(target);
        if (attackResult === ERR_NOT_IN_RANGE) {
             // Если не достаем, переключаемся на движение
             this.setState(CreepBase.STATE_MOVING);
             this.handleMovingState(); // Вызываем сразу
        } else if (attackResult === OK) {
            this.creep.say?.('⚔️ Attack!');
            // Остаемся в состоянии WORKING, продолжаем атаковать на след. тике
        } else {
             console.log(`Attacker ${this.creep.name}: Attack failed with code ${attackResult}`);
             // Можно добавить обработку других ошибок
             this.setState(CreepBase.STATE_IDLE); // В случае непонятной ошибки - в idle
        }
    }

    // handleMovingState используется из CreepBase
}

module.exports = Attacker;   
