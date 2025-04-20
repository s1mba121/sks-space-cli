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
    ip: (msg) => console.log(chalk.whiteBright(`\n${msg} \n`)),
};

module.exports = async () => {
    const config = await loadConfig();

    if (!config || !config.ip || !config.username) {
        log.error(lang.CHECK_CONFIG_ERROR);
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        log.error(lang.CHECK_PASSWORD_ERROR);
        return;
    }

    const conn = new Client();
    conn.on("ready", () => {
        log.info(lang.CHECK_START);
        conn.exec(
            "systemctl status nginx && systemctl status node",
            (err, stream) => {
                if (err) {
                    log.error(`${lang.CHECK_COMMAND_ERROR}: ${err.message}`);
                    conn.end();
                    return;
                }

                let outputData = "";

                stream.on("data", (data) => {
                    outputData += data.toString();
                });

                stream.on("close", () => {
                    if (outputData.includes("active (running)")) {
                        log.success(lang.CHECK_SERVICES_OK);
                    } else {
                        log.warn(lang.CHECK_SERVICES_ISSUE);
                        console.log(outputData);
                    }
                    log.success(lang.CHECK_DONE);
                    conn.end();
                });
            }
        );
    }).connect({ host: ip, username, password });
};
