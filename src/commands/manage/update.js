const { Client } = require("ssh2");
const { loadConfig } = require("../../services/config");
const { getPassword } = require("../../services/keyring");
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
    const config = await loadConfig();

    if (!config || !config.ip || !config.username) {
        log.error(lang.UPDATE_CONFIG_ERROR);
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        log.error(lang.UPDATE_PASSWORD_ERROR);
        return;
    }

    const conn = new Client();
    conn.on("ready", () => {
        log.info(lang.UPDATE_START);

        const commands = [
            "sudo apt update",
            "sudo apt upgrade -y",
            "sudo apt autoremove -y",
            "sudo apt clean",
        ];

        let i = 0;
        const runNext = () => {
            if (i >= commands.length) {
                conn.end();
                log.success(lang.UPDATE_DONE);
                return;
            }

            const cmd = commands[i++];
            console.log(`[~] ${cmd}`);
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    log.error(`${lang.UPDATE_COMMAND_ERROR}: ${err.message}`);
                    return runNext();
                }

                stream.on("data", (data) => {
                    process.stdout.write(data.toString());
                });

                stream.on("close", runNext);
            });
        };

        runNext();
    }).connect({ host: ip, username, password });
};
