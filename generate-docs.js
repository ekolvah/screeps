const { execSync } = require('child_process');
const path = require('path');

// Устанавливаем зависимости
console.log('Установка зависимостей...');
execSync('npm install', { stdio: 'inherit' });

// Запускаем генерацию документации
console.log('Генерация документации...');
execSync('npm run generate', { stdio: 'inherit' });

console.log('Документация успешно сгенерирована!'); 