const { askCredentials, confirmSetup } = require("../utils/prompt");
const { loadConfig, saveConfig } = require("../services/config");
const { getPassword, storePassword } = require("../services/keyring");
const {
  testConnection,
  sshConnect,
  setupServer,
} = require("../services/ssh");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk");

const log = {
  info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
  success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
  warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
  error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
  section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

function ensureSSHKeyExists() {
  const keyPath = path.join(process.env.HOME, ".ssh/id_rsa");
  const pubKeyPath = `${keyPath}.pub`;

  if (!fs.existsSync(pubKeyPath)) {
    log.info("SSH ключ не найден. Генерируем...");
    execSync(`ssh-keygen -t rsa -b 4096 -N "" -f ${keyPath}`, {
      stdio: "ignore",
    });
    log.success("SSH ключ сгенерирован.");
  } else {
    log.info("SSH ключ уже существует.");
  }
}

function ensureSshpassInstalled() {
  try {
    execSync("which sshpass", { stdio: "ignore" });
  } catch {
    log.warn("sshpass не найден. Устанавливаем через Homebrew...");
    try {
      execSync("brew install hudochenkov/sshpass/sshpass", {
        stdio: "ignore",
      });
      log.success("sshpass установлен успешно.");
    } catch (err) {
      log.error("Не удалось установить sshpass.");
      throw err;
    }
  }
}

function sendSSHKey(ip, username, password) {
  const pubKeyPath = path.join(process.env.HOME, ".ssh/id_rsa.pub");
  try {
    log.info("Отправляем SSH ключ на сервер...");
    const cmd = `sshpass -p '${password}' ssh -o StrictHostKeyChecking=no ${username}@${ip} 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys' < ${pubKeyPath}`;
    execSync(cmd, { stdio: "ignore" });
    log.success("SSH ключ успешно добавлен на сервер.");
  } catch (err) {
    log.error("Не удалось отправить SSH ключ на сервер.");
    throw err;
  }
}

module.exports = async ({ reset } = {}) => {
  if (reset) {
    const resetFn = require("./reset");
    await resetFn();
  }

  let config = await loadConfig();
  let ip, username, password;

  if (config) {
    ip = config.ip;
    username = config.username;
    password = await getPassword(username);

    if (password) {
      log.info("Конфигурация загружена. Подключение к серверу...");
      return sshConnect(ip, username);
    } else {
      log.warn("Пароль не найден. Пожалуйста, введите данные вручную.");
    }
  }

  const answers = await askCredentials();
  ip = answers.ip;
  username = answers.username;
  password = answers.password;

  log.info("Проверяем подключение к серверу...");
  const success = await testConnection(ip, username, password);

  if (!success) {
    log.error("Ошибка подключения к серверу. Проверьте IP-адрес, имя пользователя и пароль.");
    return;
  }

  log.success("Подключение успешно установлено.");

  await saveConfig(ip, username, password);
  await storePassword(username, password);

  ensureSSHKeyExists();
  ensureSshpassInstalled();
  sendSSHKey(ip, username, password);

  await setupServer(ip, username, password, "spa");
  await setupServer(ip, username, password, "node");
  await setupServer(ip, username, password, "static");

  sshConnect(ip, username);
};
