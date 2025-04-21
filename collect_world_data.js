module.exports.loop = function() {
    // Собираем информацию о комнате
    const roomData = {
        name: Game.spawns['Spawn1'].room.name,
        energyAvailable: Game.spawns['Spawn1'].room.energyAvailable,
        energyCapacityAvailable: Game.spawns['Spawn1'].room.energyCapacityAvailable,
        sources: [],
        structures: [],
        creeps: [],
        terrain: []
    };

    // Собираем информацию об источниках
    const sources = Game.spawns['Spawn1'].room.find(FIND_SOURCES);
    sources.forEach(source => {
        roomData.sources.push({
            id: source.id,
            pos: { x: source.pos.x, y: source.pos.y },
            energy: source.energy,
            energyCapacity: source.energyCapacity
        });
    });

    // Собираем информацию о структурах
    const structures = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES);
    structures.forEach(structure => {
        roomData.structures.push({
            id: structure.id,
            type: structure.structureType,
            pos: { x: structure.pos.x, y: structure.pos.y },
            hits: structure.hits,
            hitsMax: structure.hitsMax
        });
    });

    // Собираем информацию о крипах
    Object.keys(Game.creeps).forEach(creepName => {
        const creep = Game.creeps[creepName];
        roomData.creeps.push({
            name: creep.name,
            body: creep.body.map(part => part.type),
            pos: { x: creep.pos.x, y: creep.pos.y },
            memory: creep.memory
        });
    });

    // Собираем информацию о террейне
    for(let x = 0; x < 50; x++) {
        for(let y = 0; y < 50; y++) {
            const terrain = Game.spawns['Spawn1'].room.getTerrain().get(x, y);
            if(terrain !== 'plain') {
                roomData.terrain.push({
                    x: x,
                    y: y,
                    type: terrain
                });
            }
        }
    }

    // Выводим собранные данные в консоль
    console.log('Данные мира:');
    console.log(JSON.stringify(roomData, null, 2));

    // Сохраняем данные в Memory для последующего использования
    Memory.worldData = roomData;
}; 