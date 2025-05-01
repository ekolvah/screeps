# Архитектура проекта Screeps

## Общая структура

```mermaid
graph TD
    A[main.js] --> B[GameStateManager]
    A --> C[Logger]
    A --> D[Config]
    B --> E[CreepBase]
    E --> F[Harvester]
    E --> G[Builder]
    E --> H[Carrier]
    E --> I[Attacker]
```

Проект построен на основе объектно-ориентированного подхода с использованием классов для управления различными типами крипов и состояниями игры.

## Основные компоненты

### 1. Менеджер состояния игры (GameStateManager.js)
```mermaid
classDiagram
    class GameStateManager {
        +getObjectById(id)
        +getMemory()
        +getSpawn(name)
        +getTime()
        +getCreeps()
        +getStructures()
        +getSpawns()
        +findClosestByRange(originPos, findType, opts)
        +find(roomName, findType, opts)
        -_buildSimulatedObjects()
        -_simulateStore(storeData)
    }
```
- Управляет состоянием игры в режиме отладки и продакшена
- Предоставляет унифицированный интерфейс для работы с игровыми объектами
- Реализует симуляцию игровых методов для отладки
- Управляет памятью игры

### 2. Базовый класс крипа (CreepBase.js)
```mermaid
classDiagram
    class CreepBase {
        +handleState()
        +setState(newState)
        +handleIdleState()
        +handleMovingState()
        +handleWorkingState()
        +handleRenewingState()
        +handleDyingState()
    }
```
- Содержит общую логику для всех типов крипов
- Определяет основные состояния крипа:
  - IDLE (ожидание)
  - MOVING (передвижение)
  - WORKING (работа)
  - RENEWING (обновление)
  - DYING (смерть)
- Реализует базовые методы для управления состояниями

### 3. Специализированные классы крипов

```mermaid
classDiagram
    CreepBase <|-- Harvester
    CreepBase <|-- Builder
    CreepBase <|-- Carrier
    CreepBase <|-- Attacker
    
    class Harvester {
        +handleIdleState()
        +handleWorkingState()
    }
    class Builder {
        +handleIdleState()
        +handleWorkingState()
    }
    class Carrier {
        +handleIdleState()
        +handleWorkingState()
        +findEnergyTarget()
    }
    class Attacker {
        +handleIdleState()
        +handleWorkingState()
    }
```

#### Harvester (Harvester.js)
- Сборщик энергии
- Основные функции:
  - Поиск ближайшего активного источника энергии
  - Добыча энергии
  - Перемещение к источнику

#### Builder (Builder.js)
- Строитель
- Основные функции:
  - Поиск ближайшей стройплощадки
  - Строительство структур
  - Перемещение к стройплощадке

#### Carrier (Carrier.js)
- Переносчик
- Основные функции:
  - Поиск целей для переноса энергии
  - Перенос энергии между структурами
  - Приоритеты целей:
    1. Хранилище (storage)
    2. Контроллер для улучшения
    3. Спавнеры и расширения

#### Attacker (Attacker.js)
- Атакующий
- Основные функции:
  - Поиск вражеских крипов
  - Атака врагов
  - Перемещение к цели

### 4. Основной файл (main.js)
```mermaid
flowchart TD
    A[main.js] --> B[Инициализация GameStateManager]
    A --> C[Логирование состояния]
    A --> D[Очистка памяти]
    A --> E[Управление спавном]
    A --> F[Обработка крипов]
    
    B --> G[Определение режима работы]
    C --> H[Запись состояния каждые 5 тиков]
    D --> I[Удаление мертвых крипов]
    E --> J[Создание новых крипов]
    F --> K[Обработка состояний]
```

Основные функции:
- Инициализация менеджера состояния игры
- Логирование состояния (каждые 5 тиков)
- Очистка памяти мертвых крипов
- Управление спавном новых крипов
- Обработка всех крипов и их состояний

### 5. Система состояний крипов

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> MOVING: Найдена цель
    MOVING --> WORKING: Достиг цели
    WORKING --> IDLE: Задача выполнена
    WORKING --> MOVING: Цель недоступна
    MOVING --> IDLE: Нет пути
    IDLE --> RENEWING: Нужно обновление
    RENEWING --> IDLE: Обновлен
    IDLE --> DYING: Мало энергии
    DYING --> [*]: Умер
```

Каждый крип может находиться в одном из следующих состояний:
1. IDLE - ожидание новой задачи
2. MOVING - перемещение к цели
3. WORKING - выполнение основной задачи
4. RENEWING - обновление в спавнере
5. DYING - подготовка к смерти

### 6. Управление спавном

```mermaid
flowchart TD
    A[Управление спавном] --> B{Достаточно энергии?}
    B -->|Да| C[Проверка количества крипов]
    B -->|Нет| D[Ожидание]
    C --> E{Нужны сборщики?}
    E -->|Да| F[Создать сборщика]
    E -->|Нет| G{Нужны строители?}
    G -->|Да| H[Создать строителя]
    G -->|Нет| I{Нужны переносчики?}
    I -->|Да| J[Создать переносчика]
    I -->|Нет| K{Нужны атакующие?}
    K -->|Да| L[Создать атакующего]
```

Система автоматически создает крипов в зависимости от потребностей:
- Приоритеты создания:
  1. 2 сборщика энергии
  2. 2 переносчика
  3. 1 строитель
  4. 0 атакующих (по умолчанию)

### 7. Конфигурация тел крипов

```mermaid
classDiagram
    class CreepBodies {
        +Harvester: [WORK, WORK, WORK, CARRY, MOVE, MOVE] (550)
        +Harvester: [WORK, WORK, CARRY, MOVE, MOVE] (400)
        +Harvester: [WORK, WORK, CARRY, MOVE] (300)
        +Builder: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] (550)
        +Builder: [WORK, WORK, CARRY, MOVE, MOVE] (400)
        +Builder: [WORK, CARRY, MOVE, MOVE] (250)
        +Carrier: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] (600)
        +Carrier: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] (450)
        +Carrier: [CARRY, CARRY, MOVE, MOVE] (300)
        +Attacker: [TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE] (380)
        +Attacker: [ATTACK, ATTACK, MOVE, MOVE] (260)
        +Attacker: [ATTACK, MOVE] (130)
    }
```

Каждый тип крипа имеет несколько конфигураций тела в зависимости от доступной энергии:
- Сборщики: от 300 до 550 энергии
- Строители: от 250 до 550 энергии
- Переносчики: от 300 до 600 энергии
- Атакующие: от 130 до 380 энергии

### 8. Логирование

```mermaid
flowchart TD
    A[Logger.js] --> B[Логирование состояния]
    A --> C[Логирование ошибок]
    A --> D[Логирование спавна]
    B --> E[Запись каждые 5 тиков]
    C --> F[Обработка исключений]
    D --> G[Отслеживание создания крипов]
```

Система логирования включает:
- Периодическое логирование состояния игры
- Логирование ошибок и исключений
- Отслеживание процесса спавна крипов
- Запись важных событий в консоль