// Эта строчка объявляет главную функцию игрового цикла
module.exports.loop = function () {
    // Определяем имя нашего крипа и его части тела
    const creepName = 'Harvester1';
    const creepBody = [WORK, CARRY, MOVE]; // Стандартный набор: работа, переноска, движение
    const energyRequired = 200; // Стоимость WORK(100) + CARRY(50) + MOVE(50)

    // --- Логика для спавна ---
    // Получаем наш главный спавн (обычно 'Spawn1')
    var spawn = Game.spawns['Spawn1']; // Убедитесь, что ваш спавн называется Spawn1

    // Если крипа с нужным именем нет, пытаемся его создать
    if (!Game.creeps[creepName] && spawn && !spawn.spawning) {
        console.log('Крипа ' + creepName + ' нет. Пытаемся создать...');
        // Проверяем, достаточно ли энергии в комнате для создания крипа
        if (spawn.room.energyAvailable >= energyRequired) {
            var spawnResult = spawn.spawnCreep(creepBody, creepName);
            if (spawnResult == OK) {
                console.log('Начато создание крипа: ' + creepName);
                // Устанавливаем начальное состояние для нового крипа в его память
                // Память будет доступна сразу после начала спавна
                 if(Memory.creeps && !Memory.creeps[creepName]) { // Проверка на всякий случай
                     Memory.creeps[creepName] = { harvesting: true }; // Начинаем с добычи
                     console.log('Установлено начальное состояние harvesting: true для ' + creepName);
                 }
            } else {
                console.log('Ошибка при попытке создать крипа ' + creepName + ': ' + spawnResult);
            }
        } else {
            console.log('Недостаточно энергии для создания ' + creepName + '. Нужно ' + energyRequired + ', доступно ' + spawn.room.energyAvailable);
        }
    } else if (spawn && spawn.spawning && spawn.spawning.name == creepName) {
        // Если спавн занят созданием НАШЕГО крипа, выводим информацию
        console.log(spawn.name + ' создает ' + creepName + '...');
        // Можно добавить визуальный эффект на спавн
        spawn.room.visual.text(
            '🛠️' + creepName,
            spawn.pos.x + 1,
            spawn.pos.y,
            {align: 'left', opacity: 0.8});
    }

    // --- Логика для крипа ---
    var creep = Game.creeps[creepName];
    if (creep) {
        // Если крип еще не родился (spawning), он ничего не может делать
        if (creep.spawning) {
             console.log(creepName + ' еще создается (в спавне).');
            return; // Выходим из логики для этого крипа на этот тик
        }

        // --- Управление состоянием крипа (добыча/возврат) ---
        // Если крип несёт энергию и заполнился -> переключиться на возврат
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            creep.say('🔄 несу'); // Крип скажет "несу"
            console.log(creepName + ' заполнился, переключается на возврат энергии.');
        }
        // Если крип возвращал энергию и опустел -> переключиться на добычу
        if (!creep.memory.harvesting && creep.store.getUsedCapacity() == 0) {
            creep.memory.harvesting = true;
            creep.say('⚡ добываю'); // Крип скажет "добываю"
            console.log(creepName + ' опустел, переключается на добычу энергии.');
        }
        // Если память не инициализирована (на всякий случай)
        if (creep.memory.harvesting === undefined) {
             creep.memory.harvesting = true;
             console.log('Инициализация памяти для ' + creepName + ': harvesting = true');
        }


        // --- Выполнение действий в зависимости от состояния ---
        if (creep.memory.harvesting) {
            // Состояние: Добыча энергии
            var sources = creep.room.find(FIND_SOURCES);
            if (sources.length > 0) {
                var harvestResult = creep.harvest(sources[0]);
                if (harvestResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } }); // Желтый путь к источнику
                } else if (harvestResult != OK && harvestResult != ERR_BUSY) {
                     console.log(creepName + ' ошибка добычи: ' + harvestResult);
                }
            } else {
                 console.log(creepName + ' не нашел источников энергии!');
            }
        } else {
            // Состояние: Возврат энергии на спавн
            if (spawn) { // Убедимся, что спавн найден
                var transferResult = creep.transfer(spawn, RESOURCE_ENERGY);
                if (transferResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } }); // Белый путь к спавну
                } else if (transferResult == ERR_FULL) {
                     console.log(creepName + ': Спавн ' + spawn.name + ' полон энергии.');
                     // Можно добавить логику ожидания или поиска другого места для сдачи
                } else if (transferResult != OK) {
                    console.log(creepName + ' ошибка передачи энергии: ' + transferResult);
                }
            } else {
                console.log(creepName + ' не может найти спавн ' + 'Spawn1' + ' для возврата энергии!');
            }
        }
    } else if (!spawn) {
         console.log('Ошибка: Спавн с именем \'Spawn1\' не найден! Невозможно создать крипа.');
    }
    // (Если крипа нет и спавн занят созданием НЕ нашего крипа, мы просто ничего не делаем и ждем)
}