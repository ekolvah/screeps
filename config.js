// Конфигурация для режима отладки
const isProduction = typeof Game !== 'undefined';
let debugMode = false;
let debugGameState = null;
const DEBUG_STATE_FILE_PATH = './debug_state.json';

if (!isProduction) {
    // Дебаг режим - используем fs для загрузки состояния
    const fs = require('fs');
    const path = require('path');

    try {
        if (fs.existsSync(DEBUG_STATE_FILE_PATH)) {
            const fileContent = fs.readFileSync(DEBUG_STATE_FILE_PATH, 'utf8');
            debugGameState = JSON.parse(fileContent);
            debugMode = true;
            console.log(`DEBUG MODE: Successfully loaded state from ${DEBUG_STATE_FILE_PATH}`);
        }
    } catch (error) {
        console.error(`Failed to read debug state file: ${error.message}`);
        debugMode = false;
        debugGameState = null;
    }
} else {
    // Продакшен - отключаем отладку
    console.log('Running in production mode - debug features disabled');
}

module.exports = {
    DEBUG_MODE: debugMode,
    DEBUG_STATE_FILE_PATH: DEBUG_STATE_FILE_PATH,
    DEBUG_GAME_STATE: debugGameState
};