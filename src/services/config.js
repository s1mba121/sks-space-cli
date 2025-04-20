const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { getLangObject } = require("./lang");

const lang = getLangObject();

const CONFIG_PATH = path.join(os.homedir(), ".space_config.json");

const chalk = require("chalk");

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

exports.saveConfig = (ip, username) => {
    fs.writeJson(CONFIG_PATH, { ip, username }, { spaces: 2 })
        .then(() => log.success(`${lang.CONFIG_SAVED}: ${ip}, ${username}`))
        .catch((err) => log.error(`${lang.CONFIG_SAVE_ERROR}: ${err.message}`));
};

exports.loadConfig = async () => {
    if (!(await fs.pathExists(CONFIG_PATH))) {
        log.warn(lang.CONFIG_NOT_FOUND_2);
        return null;
    }
    try {
        return await fs.readJson(CONFIG_PATH);
    } catch {
        log.warn(`${lang.CONFIG_FILE_CORRUPTED}. ${lang.CONFIG_IGNORE}`);
        return null;
    }
};

exports.deleteConfig = () => {
    fs.remove(CONFIG_PATH)
        .then(() => log.success(lang.CONFIG_DELETED))
        .catch((err) =>
            log.error(`${lang.CONFIG_DELETE_ERROR}: ${err.message}`)
        );
};
