// src/commands/monitor/mem.js
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
    log.error("Пароль не найден. Проверьте настройки SSH.");
    return;
  }

  const conn = new Client();
  conn.on('ready', () => {
    log.info("Проверяем использование памяти...\n");
    conn.exec('free -h', (err, stream) => {
      if (err) {
        log.error('[!] Ошибка при получении информации о памяти:', err.message);
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
