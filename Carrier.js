const CreepBase = require('./CreepBase');

class Carrier extends CreepBase {

    // Переопределяем проверку энергии, т.к. carrier сначала ищет КУДА отнести, если полон
    checkAndRefillEnergy() {
        if (this.memory.delivering && this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            // Если доставляли и энергия кончилась, переключаемся на поиск
            this.memory.delivering = false;
            delete this.memory.deliveryTarget;
            this.creep.say?.('🔄 Pickup');
            this.setState(CreepBase.STATE_IDLE);
            return false; // Нужно искать энергию
        }
        if (!this.memory.delivering && this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            // Если искали энергию и заполнились, переключаемся на доставку
            this.memory.delivering = true;
            delete this.memory.pickupTarget;
            this.creep.say?.('🚚 Deliver');
            this.setState(CreepBase.STATE_IDLE);
            return true; // Нужно искать цель доставки
        }
        // Возвращаем текущий режим (true - доставка, false - подбор)
        return !!this.memory.delivering;
    }

    handleIdleState() {
        const delivering = this.checkAndRefillEnergy();

        let target = null;
        if (delivering) {
            // Ищем куда доставить энергию
            target = this.findDeliveryTarget();
            if (target) {
                 this.memory.deliveryTarget = target.id;
                 this.memory.target = target.id; // Цель для движения
                 console.log(`Carrier ${this.creep.name}: Found delivery target ${target.id} (${target.structureType}) at ${target.pos}`);
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState();
            } else {
                 this.creep.say?.('❓ No delivery');
                 // Нет цели? Можно подождать или улучшать контроллер (если есть WORK часть)
            }
        } else {
            // Ищем где взять энергию
            target = this.findPickupTarget();
             if (target) {
                 this.memory.pickupTarget = target.id;
                 this.memory.target = target.id; // Цель для движения
                  console.log(`Carrier ${this.creep.name}: Found pickup target ${target.id} at ${target.pos}`);
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState();
             } else {
                  this.creep.say?.('❓ No pickup');
             }
        }
    }

    handleWorkingState() {
         const delivering = this.checkAndRefillEnergy();
         const targetId = this.memory.target; // Цель движения/взаимодействия

         if (!targetId) {
            this.setState(CreepBase.STATE_IDLE);
            return;
         }
         const target = this.gameState.game.getObjectById(targetId);
         if (!target) {
             console.log(`Carrier ${this.creep.name}: Target ${targetId} not found. Going idle.`);
             delete this.memory.target;
             delete this.memory.pickupTarget;
             delete this.memory.deliveryTarget;
             this.setState(CreepBase.STATE_IDLE);
             return;
         }


         if (delivering) {
             // Доставляем энергию
             const transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
             if (transferResult === ERR_NOT_IN_RANGE) {
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState();
             } else if (transferResult === OK) {
                 // Успешно передали, возможно цель еще не полная
                 // Проверим, есть ли еще энергия у нас
                 if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                     this.memory.delivering = false; // Энергия кончилась
                     delete this.memory.deliveryTarget;
                     this.setState(CreepBase.STATE_IDLE); // Ищем новую
                 } else {
                     // Еще есть энергия, ищем новую цель для доставки (или эта же цель еще не полна)
                     delete this.memory.target; // Сбросить текущую цель движения
                     this.setState(CreepBase.STATE_IDLE); // Найти следующую (или ту же) цель доставки
                 }
             } else if (transferResult === ERR_FULL) {
                 // Цель заполнена, ищем другую
                 console.log(`Carrier ${this.creep.name}: Target ${target.id} is full. Finding new target.`);
                 delete this.memory.target;
                 delete this.memory.deliveryTarget; // Сбрасываем конкретную цель доставки
                 this.setState(CreepBase.STATE_IDLE); // Ищем новую цель
             } else if (transferResult === ERR_NOT_ENOUGH_RESOURCES) {
                 // Этой ошибки не должно быть при доставке, но на всякий случай
                 this.memory.delivering = false;
                 this.setState(CreepBase.STATE_IDLE);
             } else {
                 console.log(`Carrier ${this.creep.name}: Transfer failed with code ${transferResult}`);
                 this.setState(CreepBase.STATE_IDLE);
             }

         } else {
            // Подбираем энергию
             // Предполагаем, что цель - это контейнер, хранилище, источник или упавший ресурс
             let withdrawResult = ERR_INVALID_TARGET;
             if (target.store || target.energy !== undefined || target.resourceType === RESOURCE_ENERGY) { // Structure or Source or Dropped resource
                if(target.resourceType === RESOURCE_ENERGY) { // Dropped resource
                    withdrawResult = this.creep.pickup(target);
                } else { // Structure or Source
                    withdrawResult = this.creep.withdraw(target, RESOURCE_ENERGY);
                    // Для источников (Source) нужен harvest, а не withdraw. Уточняем логику findPickupTarget
                    // Если цель - Source, withdraw вернет ошибку. Harvester должен добывать.
                     if (withdrawResult === ERR_INVALID_TARGET && target.energyCapacity) { // Похоже на Source
                        console.log(`Carrier ${this.creep.name}: Cannot withdraw from Source ${target.id}. Carriers should pick up from containers/storage/dropped.`);
                        // Ищем другую цель
                         delete this.memory.target;
                         delete this.memory.pickupTarget;
                         this.setState(CreepBase.STATE_IDLE);
                         return;
                     }
                }
             }


             if (withdrawResult === ERR_NOT_IN_RANGE) {
                 this.setState(CreepBase.STATE_MOVING);
                 this.handleMovingState();
             } else if (withdrawResult === OK) {
                 // Успешно подобрали / начали забирать
                 if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                     // Заполнились
                     this.memory.delivering = true;
                     delete this.memory.pickupTarget;
                     this.setState(CreepBase.STATE_IDLE); // Ищем куда доставить
                 }
                 // Если не заполнились, продолжаем подбирать на след. тике (остаемся в working)
             } else if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
                 // Источник пуст
                 console.log(`Carrier ${this.creep.name}: Target ${target.id} is empty. Finding new source.`);
                 delete this.memory.target;
                 delete this.memory.pickupTarget;
                 this.setState(CreepBase.STATE_IDLE); // Ищем новый
             } else if (withdrawResult === ERR_FULL) {
                 // Мы уже полны
                 this.memory.delivering = true;
                 delete this.memory.pickupTarget;
                 this.setState(CreepBase.STATE_IDLE); // Ищем куда доставить
             } else {
                  console.log(`Carrier ${this.creep.name}: Pickup/Withdraw failed with code ${withdrawResult}`);
                 this.setState(CreepBase.STATE_IDLE);
             }
         }
    }

    // Ищет, КУДА доставить энергию
    findDeliveryTarget() {
         // Приоритет: Спавны и расширения
        let target = this.findClosestTarget(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN) &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        // Затем башни (если есть)
        if (!target) {
            target = this.findClosestTarget(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_TOWER &&
                           structure.store.getFreeCapacity(RESOURCE_ENERGY) > 200; // Оставляем запас
                }
            });
        }

        // Затем хранилище
        if (!target) {
             const room = this.gameState.game.rooms[this.creep.pos.roomName];
             if(room && room.storage && room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                  target = this.gameState.game.getObjectById(room.storage.id);
             }
        }

        return target;
    }

    // Ищет, ГДЕ взять энергию
    findPickupTarget() {
        // Приоритет: Упавшие ресурсы
         let target = this.findClosestTarget(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
         });

        // Затем контейнеры
        if (!target) {
            target = this.findClosestTarget(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                               s.store.getUsedCapacity(RESOURCE_ENERGY) > 100 // Ищем не почти пустые
            });
        }

        // Затем хранилище
        if (!target) {
            const room = this.gameState.game.rooms[this.creep.pos.roomName];
             if(room && room.storage && room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                  target = this.gameState.game.getObjectById(room.storage.id);
             }
        }

        // НЕ ИЩЕМ ИСТОЧНИКИ (Source) - это работа Harvester'ов
        // Иначе carrier будет стоять у источника и ждать регенерации

        return target;
    }

    // handleMovingState используется из CreepBase
}

module.exports = Carrier;