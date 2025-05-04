const CreepBase = require('./CreepBase');

class Harvester extends CreepBase {

     // Проверяем, нужно ли отнести энергию или можно копать
     checkAndDepositEnergy() {
        // Если заполнились и не доставляем, переключаемся на доставку
        if (!this.memory.delivering && this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            this.memory.delivering = true;
            delete this.memory.sourceTarget; // Забываем источник
            this.creep.say?.('⚡ Deliver NRG');
            this.setState(CreepBase.STATE_IDLE); // Идем в idle для поиска цели доставки
            return true; // Нужно доставлять
        }
         // Если доставляли и опустели, переключаемся на добычу
        if (this.memory.delivering && this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            this.memory.delivering = false;
            delete this.memory.deliveryTarget; // Забываем цель доставки
            this.creep.say?.('⛏️ Harvest');
            this.setState(CreepBase.STATE_IDLE); // Идем в idle для поиска источника
            return false; // Нужно копать
        }
         // Возвращаем текущий режим (true - доставка, false - добыча)
        return !!this.memory.delivering;
     }


    handleIdleState() {
        const delivering = this.checkAndDepositEnergy();

        if (delivering) {
             // Ищем куда отнести энергию
             const target = this.findDeliveryTarget();
             if (target) {
                 this.memory.deliveryTarget = target.id;
                 this.memory.target = target.id; // Цель для движения
                 console.log(`Harvester ${this.creep.name}: Found delivery target ${target.id} (${target.structureType || 'source/ctrl'}) at ${target.pos}`);
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState();
             } else {
                 this.creep.say?.('❓ No deposit');
                 // Некуда нести? Можно сбросить рядом с источником или ждать
                 // Если есть контейнер рядом с источником, можно построить его
             }
        } else {
            // Ищем источник для добычи
            // Если есть назначенный источник, идем к нему
             let source = this.memory.assignedSource ? this.gameState.getObjectById(this.memory.assignedSource) : null;

             if (!source) { // Если нет назначенного или он исчез
                source = this.findClosestTarget(FIND_SOURCES_ACTIVE);
             }

            if (source) {
                console.log(`Harvester ${this.creep.name}: Target source ${source.id} at ${source.pos}`);
                this.memory.sourceTarget = source.id;
                this.memory.target = source.id; // Цель для движения
                this.setState(CreepBase.STATE_MOVING);
                this.handleMovingState();
            } else {
                 this.creep.say?.('💧 No sources?');
                 // Нет активных источников? Ждем.
            }
        }
    }

    handleWorkingState() {
        const delivering = this.checkAndDepositEnergy();
        const targetId = this.memory.target;

        if (!targetId) {
            this.setState(CreepBase.STATE_IDLE);
            return;
        }
        const target = this.gameState.getObjectById(targetId);
        if (!target) {
            console.log(`Harvester ${this.creep.name}: Target ${targetId} not found. Going idle.`);
            delete this.memory.target;
            delete this.memory.sourceTarget;
            delete this.memory.deliveryTarget;
            this.setState(CreepBase.STATE_IDLE);
            return;
        }

        if (delivering) {
            // Несем энергию
            const transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
            if (transferResult === ERR_NOT_IN_RANGE) {
                this.setState(CreepBase.STATE_MOVING);
                this.handleMovingState();
            } else if (transferResult === OK) {
                // Успешно передали
                 if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                    // Опустели, идем копать
                    this.memory.delivering = false;
                    delete this.memory.deliveryTarget;
                    this.setState(CreepBase.STATE_IDLE);
                } else {
                    // Еще есть энергия, но цель может быть полна. Ищем новую цель.
                    delete this.memory.target;
                    this.setState(CreepBase.STATE_IDLE);
                }
            } else if (transferResult === ERR_FULL) {
                 // Цель полна, ищем другую
                 console.log(`Harvester ${this.creep.name}: Delivery target ${target.id} is full. Finding new target.`);
                 delete this.memory.target;
                 delete this.memory.deliveryTarget;
                 this.setState(CreepBase.STATE_IDLE);
            } else {
                 console.log(`Harvester ${this.creep.name}: Transfer failed with code ${transferResult}`);
                 this.setState(CreepBase.STATE_IDLE);
            }
        } else {
            // Копаем энергию
             const harvestResult = this.creep.harvest(target);
             if (harvestResult === ERR_NOT_IN_RANGE) {
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState(); // Идем к источнику
             } else if (harvestResult === OK) {
                 this.creep.say?.('⛏️ Harvest!');
                 // Продолжаем копать. Проверка на заполнение произойдет в checkAndDepositEnergy в начале следующего тика.
             } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
                 // Источник иссяк
                 console.log(`Harvester ${this.creep.name}: Source ${target.id} depleted. Finding new source.`);
                 delete this.memory.target;
                 delete this.memory.sourceTarget;
                 this.setState(CreepBase.STATE_IDLE);
             } else if (harvestResult === ERR_TIRED) {
                 // Крип устал (мало MOVE частей?)
                 this.creep.say?.('😩 Tired');
             } else {
                 console.log(`Harvester ${this.creep.name}: Harvest failed with code ${harvestResult}`);
                 this.setState(CreepBase.STATE_IDLE);
             }
        }
    }

    // Ищет, КУДА отнести энергию (похоже на Carrier, но может иметь другие приоритеты)
    findDeliveryTarget() {
         // Приоритет: Ближайший спавн, расширение или контейнер
        let target = this.findClosestTarget(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_CONTAINER) && // Добавляем контейнеры
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        // Если рядом нет ничего, несем в хранилище
        if (!target) {
             const room = this.gameState.getRooms()[this.creep.pos.roomName];
             if(room && room.storage && room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                 target = this.gameState.getObjectById(room.storage.id);
             }
        }
         // Можно добавить сброс на землю, если совсем некуда нести
         // if (!target) { creep.drop(RESOURCE_ENERGY); }

        return target;
    }

    // handleMovingState используется из CreepBase
}

module.exports = Harvester;