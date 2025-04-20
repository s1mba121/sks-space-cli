const chalk = require("chalk");
const { getLangObject } = require("../../services/lang");

const lang = getLangObject();
const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
    ip: (msg) => console.log(chalk.whiteBright(`\n${msg} \n`)),
};

module.exports = async () => {
    log.info(lang.RELOAD_MESSAGE);

    const stop = require("./stop");
    const start = require("./start");

    await stop();
    await start();
};
