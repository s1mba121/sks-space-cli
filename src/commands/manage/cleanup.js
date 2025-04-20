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
    log.error("Пароль не найден. Проверьте настройки SSH.");
    return;
  }

  const conn = new Client();
  conn.on("ready", () => {
    log.info("Очищаем логи и временные файлы...");

    const commands = [
      "sudo rm -rf /var/log/*.gz /var/log/*.1",
      "sudo journalctl --vacuum-time=7d",
      "sudo apt autoremove -y",
      "sudo apt clean"
    ];

    let index = 0;
    const runNext = () => {
      if (index >= commands.length) return conn.end();
      const cmd = commands[index++];
      console.log(`[~] ${cmd}`);
      conn.exec(cmd, (err, stream) => {
        if (err) return runNext();
        stream.on("close", runNext);
      });
    };

    runNext();
  }).connect({ host: ip, username, password });
};
