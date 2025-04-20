// src/commands/cpu.js
const { Client } = require('ssh2');
const { loadConfig } = require("../../services/config");
const { getPassword } = require("../../services/keyring");
const chalk = require("chalk");

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
    ip: (msg) => console.log(chalk.whiteBright(`\n${msg} \n`)),
};

module.exports = async () => {
    const config = await loadConfig();

    if (!config || !config.ip || !config.username) {
        log.error("Не удалось загрузить конфигурацию или данные для подключения.");
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
        log.info('Получение информации о процессоре...');
        conn.exec('top -bn1 | grep "Cpu(s)"', (err, stream) => {
            if (err) {
                log.error('Ошибка при получении информации о процессоре:', err.message);
                conn.end();
                return;
            }

            stream.on('data', (data) => {
                const cpuUsage = data.toString().trim();
                log.info("Строка CPU:", cpuUsage);

                const cpuData = cpuUsage.split(',');
                const cpuInfo = {};

                cpuData.forEach(item => {
                    const parts = item.trim().split(' ');
                    const key = parts[1];
                    const value = parseFloat(parts[0]);

                    if (key && !isNaN(value)) {
                        cpuInfo[key] = value;
                    }
                });

                // Выводим информацию в удобном формате
                console.log("Использование процессора:");
                console.log(`  Пользовательский режим (us): ${cpuInfo["us"]}%`);
                console.log(`  Системный режим (sy): ${cpuInfo["sy"]}%`);
                console.log(`  Идентифицированный (id): ${cpuInfo["id"]}%`);
                console.log(`  Ожидание (wa): ${cpuInfo["wa"]}%`);
                console.log(`  Прерывания (hi): ${cpuInfo["hi"]}%`);
                console.log(`  Софт-истечения (si): ${cpuInfo["si"]}%`);
                console.log(`  Стек (st): ${cpuInfo["st"]}%`);
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
