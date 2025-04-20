// lang/ru.js
module.exports = {
    CONNECT_DESCRIPTION: "Подключиться к серверу",
    INIT_DESCRIPTION: "Инициализировать проект с конфигурацией деплоя",
    DEPLOY_DESC: "Управление деплоем приложения",
    USAGE: "Использование:",
    OPTIONS: "Опции:",
    COMMANDS: "Команды:",
    NEED_CONNECT:
        "Не выполнено подключение к серверу. Используйте команду `space connect`.",
    RESET_CONNECTIN: "Сбросить конфигурацию перед подключением",
    TEST_CONNECTION: "Проверка доступности сервера",
    CHECK_DESCRIPTION: "Проверка состояния сервисов на сервере",
    UPTIME_DESCRIPTION: "Получить время работы сервера",
    DISK_DESCRIPTION: "Проверка использования диска на сервере",
    REBOOT_DESCRIPTION: "Перезагрузка сервера",
    CLEANUP_DESCRIPTION: "Очистка временных файлов на сервере",
    UPDATE_DESCRIPTION: "Обновление проекта",
    MEM_DESCRIPTION: "Проверка использования памяти на сервере",
    DEPLOY_DESCRIPTION: "Управление деплоем приложения",
    START_DESCRIPTION: "Запуск приложения на сервере",
    STOP_DESCRIPTION: "Остановка приложения на сервере",
    RELOAD_DESCRIPTION: "Перезапуск приложения на сервере",
    LANGUAGE_SWITCH_SUCCESS: (langCode) =>
        `Язык переключен на ${langCode.toUpperCase()}`,
    LANGUAGE_SWITCH_ERROR: "Неподдерживаемый язык. Используйте 'En' или 'Ru'.",

    RSYNC_INSTALLING: "rsync не найден. Устанавливаем...",
    RSYNC_UNSUPPORTED:
        "Автоустановка rsync не поддерживается на этой системе. Установите вручную.",
    RSYNC_FAILED: "Не удалось установить rsync автоматически",
    DEPLOY_START: (project, ip) => `Деплой проекта ${project} на сервер ${ip}`,
    RUNNING_PREDEPLOY: (cmd) => `Выполняем preDeploy команду: ${cmd}`,
    REMOVING_OLD_DIR: (path) => `Удаляем старую директорию на сервере: ${path}`,
    SCRIPT_GENERATED: "Скрипт start-server.sh сгенерирован.",
    SCANNING_FILES: "Сканируем файлы для загрузки...",
    UPLOADING_FILES: (count) => `Загружаем ${count} файл(ов):`,
    UPLOADING_ENV: "Загружаем .env файл...",
    RESTARTING_SERVER: (port) =>
        `Перезапускаем http-server на порту ${port}...`,
    RUNNING_POSTDEPLOY: (cmd) => `Выполняем postDeploy команду: ${cmd}`,
    DEPLOY_SUCCESS: "Проект успешно задеплоен!",
    ACCESSIBLE_AT: (url) => `Доступен по адресу: ${url}`,

    LANGUAGE_SWITCH_SUCCESS: (langCode) =>
        `Язык переключен на ${langCode.toUpperCase()}`,
    LANGUAGE_SWITCH_ERROR: "Неподдерживаемый язык. Используйте 'En' или 'Ru'.",

    RELOAD_MESSAGE: "Перезагрузка приложения...",

    CONFIG_NOT_FOUND: (env) => `Конфигурация .space.${env}.json не найдена`,
    SERVER_STARTED: (port) => `Сервер на порту ${port} запущен`,
    SERVER_STOPPED: (port) => `Сервер на порту ${port} остановлен`,
    SERVER_START_FAILED: (msg) => `Не удалось запустить сервер: ${msg}`,
    SERVER_STOP_FAILED: (msg) => `Не удалось остановить сервер: ${msg}`,

    CLEANUP_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    CLEANUP_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    CLEANUP_START: "Очищаем логи и временные файлы...",

    REBOOT_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    REBOOT_PASSWORD_ERROR:
        "Не удалось получить пароль. Проверьте настройки SSH.",
    REBOOT_START: "Перезагрузка сервера...",
    REBOOT_EXEC_ERROR: "Ошибка при перезагрузке",

    UPDATE_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    UPDATE_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    UPDATE_START: "Обновляем пакеты на сервере...",
    UPDATE_COMMAND_ERROR: "Ошибка при выполнении команды",
    UPDATE_DONE: "Обновление завершено.",

    CHECK_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    CHECK_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    CHECK_START: "Проверка состояния сервисов...",
    CHECK_COMMAND_ERROR: "Ошибка при выполнении команды",
    CHECK_SERVICES_OK: "Сервисы работают нормально.",
    CHECK_SERVICES_ISSUE: "Обнаружены проблемы с сервисами:",
    CHECK_DONE: "Проверка завершена.",

    DISK_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    DISK_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    DISK_CHECK_START: "Проверяем использование диска...",
    DISK_COMMAND_ERROR: "Ошибка при получении информации о диске",
    DISK_DONE: "Проверка завершена.",

    MEM_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    MEM_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    MEM_CHECK_START: "Проверяем использование памяти...\n",
    MEM_COMMAND_ERROR: "Ошибка при получении информации о памяти",
    MEM_DONE: "Проверка завершена.",

    PING_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    PING_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    PING_CHECK_START: "Проверка доступности сервера...",
    PING_COMMAND_ERROR: "Ошибка при пинге",
    PING_SERVER_OK: "Сервер доступен.",
    PING_SERVER_FAIL: "Сервер недоступен.",

    UPTIME_CONFIG_ERROR:
        "Не удалось загрузить конфигурацию или данные для подключения.",
    UPTIME_PASSWORD_ERROR: "Пароль не найден. Проверьте настройки SSH.",
    UPTIME_CHECK_START: "Проверка времени работы сервера...",
    UPTIME_COMMAND_ERROR: "Ошибка при получении времени работы сервера",

    RESET_SUCCESS: "Конфигурация и пароль сброшены.",

    BUILD_PROJECT: "Сборка проекта",
    BUILD_ERROR: "Сборка завершилась с ошибкой",
    BUILD_SUCCESS: "Сборка завершена",

    CONFIG_SAVED: "Конфигурация сохранена",
    CONFIG_SAVE_ERROR: "Ошибка при сохранении конфигурации",
    CONFIG_NOT_FOUND_2: "Конфигурационный файл не найден",
    CONFIG_FILE_CORRUPTED: "Конфигурационный файл поврежден",
    CONFIG_IGNORE: "Игнорируем поврежденный файл",
    CONFIG_DELETED: "Конфигурация удалена",
    CONFIG_DELETE_ERROR: "Ошибка при удалении конфигурации",

    UNKNOWN_PROJECT_TYPE:
        "Неизвестный тип проекта. Доступные типы: spa, node, static.",
    SETTING_UP_SERVER: "Настройка сервера...",
    SERVER_SETUP_SUCCESS: "Сервер успешно настроен.",
    SERVER_SETUP_ERROR: "Ошибка при настройке сервера.",
    CONNECTION_ERROR: "Ошибка подключения",

    INIT_PROJECT_DESC: "Инициализировать проект с конфигурацией деплоя",
    SELECT_ENV: "Какую среду настраиваем?",
    DEV_ENV: "Разработка (dev)",
    PROD_ENV: "Продакшен (production)",
    FILE_EXISTS: "Файл уже существует.",
    OVERWRITE_CONFIRM: "Перезаписать?",
    CANCEL_INIT: "Отмена инициализации.",
    PROMPT_IP: "IP сервера:",
    PROMPT_USER: "Пользователь:",
    PROMPT_PROJECT_NAME: "Имя проекта:",
    PROMPT_PROJECT_TYPE: "Тип проекта:",
    SPA_TYPE: "Single Page App (React/Vue)",
    NODE_TYPE: "Node.js Backend",
    STATIC_TYPE: "Статический сайт",
    PROMPT_LOCAL_PATH: "Путь к папке с проектом (на локальной машине):",
    PROMPT_REMOTE_PATH: "Путь на сервере:",
    PROMPT_PRE_DEPLOY: "Команда перед деплоем (например, сборка):",
    PROMPT_POST_DEPLOY: "Команда после деплоя (например, очистка кэша):",
    PROMPT_LOAD_ENV: "Загрузить переменные окружения из .env?",
    PROMPT_NGINX_CONFIGURED: "Nginx уже настроен?",
    PROMPT_NGINX_SETUP: "Настроить Nginx для проекта?",
    PROMPT_DOMAIN: "Домен (например, example.com):",
    PROMPT_SUBDOMAIN: "Поддомен (например, dev):",
    PROMPT_PORT: "Порт для локального сервера:",
    PROMPT_SSL: "Использовать SSL (для продакшн):",
    NGINX_CONFIG_SAVED: "Конфигурация Nginx сохранена в",
    CONFIG_CREATED: "Конфигурация сохранена!",
};
