const { Client } = require("ssh2");
const { loadConfig } = require("../../services/config");
const { getPassword } = require("../../services/keyring");
const { program } = require("commander");
const chalk = require("chalk");

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
    ip: (msg) => console.log(chalk.whiteBright(`\n${msg} \n`)),
};

program
  .option("-N, --nginx", "Перезапустить Nginx")
  .action(async (opts) => {
    const config = await loadConfig();

    if (!config || !config.ip || !config.username) {
      console.log("[!] Не удалось загрузить конфигурацию или данные для подключения.");
      return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
      console.log("[!] Пароль не найден.");
      return;
    }

    if (!opts.nginx) {
      console.log("[!] Пока доступна только перезагрузка Nginx через флаг --nginx.");
      return;
    }

    const conn = new Client();
    conn.on("ready", () => {
      console.log("[*] Перезапуск Nginx...");
      conn.exec("sudo systemctl restart nginx", (err, stream) => {
        if (err) {
          console.log("[!] Ошибка при перезапуске:", err.message);
          conn.end();
          return;
        }

        stream.on("close", () => conn.end());
      });
    }).connect({ host: ip, username, password });
  });

module.exports = program;
