// Конфигурация для режима отладки
module.exports = {
    /**
     * Включен ли режим отладки?
     * В продакшене (на сервере Screeps) это значение ДОЛЖНО быть false.
     * Для локального дебага установите в true и укажите путь к файлу состояния.
     */
    DEBUG_MODE: false,
    /**
     * Путь к файлу JSON с сохраненным состоянием игры для отладки.
     * Актуально только если DEBUG_MODE = true.
     * Убедитесь, что Node.js имеет права на чтение этого файла.
     * Пример: 'C:/path/to/your/screeps/debug_state.json'
     * ВАЖНО: Вне Screeps окружения, для чтения файла нужен Node.js 'fs' модуль.
     * Этот файл не будет работать непосредственно в симуляторе Screeps без адаптации.
     * Для простоты примера, предположим, что данные уже загружены в переменную DEBUG_GAME_STATE,
     * если DEBUG_MODE = true. В реальном локальном запуске вам понадобится `require('fs')`.
     */
    DEBUG_STATE_FILE_PATH: './debug_state.json', // Пример пути

    /**
     * ЗАГЛУШКА: В реальном локальном дебаггере здесь будет объект,
     * загруженный из DEBUG_STATE_FILE_PATH с помощью require('fs').
     * Для примера внутри Screeps оставим null.
     * Пример структуры см. в Logger.js
     */
    DEBUG_GAME_STATE: null
};

// --- Логика для локального запуска (НЕ для Screeps сервера) ---
// Раскомментируйте этот блок, если запускаете скрипт локально с Node.js для дебага
/*
if (module.exports.DEBUG_MODE) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(module.exports.DEBUG_STATE_FILE_PATH);
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            module.exports.DEBUG_GAME_STATE = JSON.parse(fileContent);
            console.log(`DEBUG MODE: Successfully loaded state from ${filePath}`);
        } else {
            console.error(`DEBUG MODE ERROR: State file not found at ${filePath}`);
            module.exports.DEBUG_MODE = false; // Отключаем дебаг, если файл не найден
        }
    } catch (error) {
        console.error(`DEBUG MODE ERROR: Failed to read or parse state file ${filePath}:`, error);
        module.exports.DEBUG_MODE = false; // Отключаем дебаг при ошибке
    }
}
*/
// --- Конец блока для локального запуска ---