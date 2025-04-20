const { loadConfig, deleteConfig } = require("../services/config");
const { deletePassword } = require("../services/keyring");
const { getLangObject } = require("../services/lang");
const chalk = require("chalk");

const lang = getLangObject();

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

module.exports = async () => {
    const config = await loadConfig();
    if (config && config.username) {
        await deletePassword(config.username);
    }
    await deleteConfig();
    log.success(lang.RESET_SUCCESS);
    process.exit(0);
};
