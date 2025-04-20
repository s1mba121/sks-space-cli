// src/commands/disk.js
const { Client } = require('ssh2');
const { loadConfig } = require("../../services/config");
const { getPassword } = require("../../services/keyring");

module.exports = async () => {
    const config = await loadConfig();

    if (!config || !config.ip || !config.username) {
        console.log('[!] Не удалось загрузить конфигурацию или данные для подключения.');
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        console.log("[!] Пароль не найден.");
        return;
    }
    const conn = new Client();
    conn.on('ready', () => {
        console.log("[*] Проверяем использование диска...");
        conn.exec('df -h', (err, stream) => {
            if (err) {
                console.log('[!] Ошибка при получении информации о диске:', err.message);
                conn.end();
                return;
            }

            stream.on('data', (data) => {
                console.log(data.toString());
            });

            stream.on('close', (code) => {
                conn.end();
            });
        });
    }).connect({
        host: ip,
        username: username,
        password: password
    });
};
