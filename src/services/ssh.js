const { Client } = require("ssh2");
const { execSync } = require("child_process");
const chalk = require("chalk");

const log = {
  info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
  success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
  warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
  error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
  section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

// ==========================
// 🔧 Утилита для выполнения SSH-команд
// ==========================
function runSSHCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on("close", (code) => {
        resolve(code === 0);
      });
    });
  });
}

// ==========================
// 🚀 Настройка сервера по типу проекта
// ==========================
async function setupServer(ip, username, password, type) {
  const baseCmd = (cmd) =>
    `sshpass -p '${password}' ssh -o StrictHostKeyChecking=no ${username}@${ip} "${cmd}"`;

  const createDirs = {
    spa: ["mkdir -p /var/www/spa"],
    node: ["mkdir -p /var/www/node"],
    static: ["mkdir -p /var/www/static"],
  };

  const commands = createDirs[type];

  if (!commands) {
    log.error("Неизвестный тип проекта. Доступные типы: spa, node, static.");
    return;
  }

  log.info("Настройка сервера...");

  try {
    for (const cmd of commands) {
      execSync(baseCmd(cmd), { stdio: "ignore" });
    }
    log.success("Сервер успешно настроен.");
  } catch (err) {
    log.error("Ошибка при настройке сервера.");
    throw err;
  }
}

// ==========================
// 🧪 Проверка подключения
// ==========================
function testConnection(ip, username, password) {
  return new Promise((resolve) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.end();
        resolve(true);
      })
      .on("error", (err) => {
        log.error("Ошибка подключения:", err.message);
        resolve(false);
      })
      .connect({
        host: ip,
        username,
        password,
        readyTimeout: 5000,
      });
  });
}

// ==========================
// 💻 Подключение к серверу с ключом
// ==========================
function sshConnect(ip, username) {
  const { spawn } = require("child_process");
  spawn("ssh", [`${username}@${ip}`], { stdio: "inherit" });
}

function sshConnectWithKey(ip, username, command) {
  const sshCommand = `ssh -o StrictHostKeyChecking=no ${username}@${ip} "${command}"`;
  execSync(sshCommand, { stdio: "inherit" });
}

// ==========================
// 📤 Экспорт
// ==========================
module.exports = {
  testConnection,
  setupServer,
  sshConnect,
  sshConnectWithKey,
};
