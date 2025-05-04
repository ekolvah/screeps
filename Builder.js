const CreepBase = require('./CreepBase');

class Builder extends CreepBase {

     checkAndRefillEnergy() {
        // Проверяем, нужна ли энергия
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            this.memory.working = false; // Флаг, что нужно искать энергию
            this.creep.say?.('🔄 Need NRG');
            this.setState(CreepBase.STATE_IDLE); // Идем в idle для поиска источника
            return false; // Энергии нет
        }
        // Если энергия есть, и мы не работали, устанавливаем флаг работы
        if (!this.memory.working && this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
             this.memory.working = true;
             delete this.memory.sourceTarget; // Забываем источник энергии
             this.setState(CreepBase.STATE_IDLE); // Идем в idle для поиска стройки
        }
        return this.memory.working; // Возвращаем текущий статус работы (строим или ищем энергию)
    }


    handleIdleState() {
         if (!this.checkAndRefillEnergy()) {
             // Нужно искать энергию
             // Логика поиска источника энергии (например, контейнер или хранилище)
             const energySource = this.findEnergySource();
             if (energySource) {
                 this.memory.sourceTarget = energySource.id;
                 this.memory.target = energySource.id; // Используем target для движения
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState(); // Начинаем движение сразу
             } else {
                 this.creep.say?.('❓ No NRG src');
             }
             return; // Выходим, т.к. ищем энергию
         }

        // Если есть энергия (working = true), ищем стройплощадку
        const constructionSite = this.findClosestTarget(FIND_CONSTRUCTION_SITES);
        if (constructionSite) {
            console.log(`Builder ${this.creep.name}: Found site ${constructionSite.id} at ${constructionSite.pos}`);
            this.memory.target = constructionSite.id;
            this.setState(CreepBase.STATE_MOVING);
            this.handleMovingState(); // Начинаем движение сразу
        } else {
             this.creep.say?.('🚧 No sites');

        }
    }

    handleWorkingState() {
        // Проверяем энергию перед работой
         if (!this.checkAndRefillEnergy()) {
             // Энергия кончилась во время работы/движения
             return;
         }

        const targetId = this.memory.target;
         if (!targetId) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        const target = this.gameState.game.getObjectById(targetId);

        // Проверяем, что это стройплощадка или источник энергии (если мы забирали энергию)
        if (!target) {
             console.log(`Builder ${this.creep.name}: Target ${targetId} not found. Going idle.`);
            delete this.memory.target;
            delete this.memory.sourceTarget;
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (target.progress !== undefined) { // Это стройплощадка
            const buildResult = this.creep.build(target);
            if (buildResult === ERR_NOT_IN_RANGE) {
                this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState(); // Двигаемся к стройке
            } else if (buildResult === OK) {
                this.creep.say?.('🔨 Build!');
                // Продолжаем работать
            } else if (buildResult === ERR_NOT_ENOUGH_RESOURCES) {
                this.memory.working = false; // Кончилась энергия
                this.setState(CreepBase.STATE_IDLE); // Ищем новую
            } else {
                console.log(`Builder ${this.creep.name}: Build failed with code ${buildResult}`);
                this.setState(CreepBase.STATE_IDLE);
            }
        } else if (target.energy !== undefined || target.store !== undefined) { // Это источник энергии (source, container, storage)
             const withdrawResult = this.creep.withdraw(target, RESOURCE_ENERGY);
             if (withdrawResult === ERR_NOT_IN_RANGE) {
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState(); // Двигаемся к источнику
             } else if (withdrawResult === OK || withdrawResult === ERR_FULL) {
                 // Взяли энергию или уже полные
                 this.memory.working = true; // Переключаемся на работу
                 delete this.memory.sourceTarget;
                 delete this.memory.target;
                 this.setState(CreepBase.STATE_IDLE); // Ищем стройплощадку
             } else if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
                 // Источник пуст, ищем другой
                 delete this.memory.sourceTarget;
                 delete this.memory.target;
                 this.setState(CreepBase.STATE_IDLE);
             } else {
                 console.log(`Builder ${this.creep.name}: Withdraw failed with code ${withdrawResult}`);
                 this.setState(CreepBase.STATE_IDLE);
             }
        } else {
            // Цель не стройплощадка и не источник энергии? Странно.
            console.log(`Builder ${this.creep.name}: Invalid target type for working state: ${targetId}`);
             delete this.memory.target;
            delete this.memory.sourceTarget;
            this.setState(CreepBase.STATE_IDLE);
        }
    }

     // Вспомогательный метод для поиска источника энергии
    findEnergySource() {
        // Пример: ищем контейнеры или хранилище с энергией
        let source = this.findClosestTarget(FIND_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 50 // Ищем не пустые
        });

        // Если не нашли, можно искать активные источники (но это менее эффективно для строителя)
        // if (!source) {
        //     source = this.findClosestTarget(FIND_SOURCES_ACTIVE);
        // }
        if (source) {
             console.log(`Builder ${this.creep.name}: Found energy source ${source.id} at ${source.pos}`);
        }
        return source;
    }

    // handleMovingState используется из CreepBase
}

module.exports = Builder;