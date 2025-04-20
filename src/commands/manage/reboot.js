const { Client } = require("ssh2");
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
    log.error("Не удалось получить пароль. Проверьте настройки SSH.");
    return;
  }

  const conn = new Client();
  conn.on("ready", () => {
    log.info("Перезагрузка сервера...");
    conn.exec("sudo reboot", (err, stream) => {
      if (err) {
        log.error("Ошибка при перезагрузке:", err.message);
        conn.end();
        return;
      }

      stream.on("close", () => {
        conn.end();
      });
    });
  }).connect({ host: ip, username, password });
};
