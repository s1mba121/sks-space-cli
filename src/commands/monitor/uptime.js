const { Client } = require("ssh2");
const { loadConfig } = require("../../services/config");
const { getPassword } = require("../../services/keyring");
const { getLangObject } = require("../../services/lang");
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

    if (!config || !config.ip || !config.username) {
        log.error(lang.UPTIME_CONFIG_ERROR);
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        log.error(lang.UPTIME_PASSWORD_ERROR);
        return;
    }

    const conn = new Client();
    conn.on("ready", () => {
        log.info(lang.UPTIME_CHECK_START);
        conn.exec("uptime", (err, stream) => {
            if (err) {
                log.error(`${lang.UPTIME_COMMAND_ERROR}: ${err.message}`);
                conn.end();
                return;
            }

            stream.on("data", (data) => {
                log.info(data.toString());
            });

            stream.on("close", (code) => {
                conn.end();
            });
        });
    }).connect({
        host: ip,
        username: username,
        password: password,
    });
};
