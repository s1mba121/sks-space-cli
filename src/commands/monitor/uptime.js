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
        log.section(lang.UPTIME_CHECK_START);
        conn.exec("uptime", (err, stream) => {
            if (err) {
                log.error(`${lang.UPTIME_COMMAND_ERROR}: ${err.message}`);
                conn.end();
                return;
            }

            let output = "";
            stream.on("data", (data) => {
                output += data.toString();
            });

            stream.on("close", (code) => {
                if (output) {
                    const uptimeRegex =
                        /up\s(.+),\s+(\d+)\susers?,\s+load average:\s(.+)/;
                    const match = output.match(uptimeRegex);

                    if (match) {
                        const [, uptime, users, load] = match;
                        log.success(`⏱  Uptime: ${chalk.greenBright(uptime)}`);
                        log.info(`👤  Users: ${chalk.cyan(users)}`);
                        log.info(`📊  Load average: ${chalk.yellow(load)}`);
                    } else {
                        log.info(output);
                    }
                }
                conn.end();
            });
        });
    }).connect({ host: ip, username, password });
};
