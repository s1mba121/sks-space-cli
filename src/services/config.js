// src/services/config.js

const fs = require("fs-extra");
const os = require("os");
const path = require("path");

const CONFIG_PATH = path.join(os.homedir(), ".space_config.json");

const chalk = require("chalk");

const log = {
  info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
  success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
  warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
  error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
  section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

exports.saveConfig = (ip, username) =>
  fs.writeJson(CONFIG_PATH, { ip, username }, { spaces: 2 });

exports.loadConfig = async () => {
  if (!(await fs.pathExists(CONFIG_PATH))) return null;
  try {
    return await fs.readJson(CONFIG_PATH);
  } catch {
    log.warn("Конфигурационный файл поврежден. Игнорируем.");
    return null;
  }
};

exports.deleteConfig = () => fs.remove(CONFIG_PATH);
