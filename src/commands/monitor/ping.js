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
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} ===\n`)),
};

module.exports = async () => {
    const config = await loadConfig();

    if (!config || !config.ip || !config.username) {
        log.error(lang.PING_CONFIG_ERROR);
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        log.error(lang.PING_PASSWORD_ERROR);
        return;
    }

    const conn = new Client();
    conn.on("ready", () => {
        log.section(`${lang.PING_CHECK_START} ${ip}`);

        conn.exec(`ping -c 4 ${ip}`, (err, stream) => {
            if (err) {
                log.error(`${lang.PING_COMMAND_ERROR}: ${err.message}`);
                conn.end();
                return;
            }

            let output = "";
            stream.on("data", (data) => {
                output += data.toString();
            });

            stream.on("close", (code) => {
                if (!output) {
                    log.warn(lang.PING_NO_RESPONSE);
                    conn.end();
                    return;
                }

                const lines = output.split("\n");
                const statsLine = lines.find((line) =>
                    line.includes("packet loss")
                );
                const rttLine = lines.find((line) =>
                    line.includes("rtt min/avg/max/mdev")
                );

                if (statsLine) {
                    const lossMatch = statsLine.match(/(\d+)% packet loss/);
                    const loss = lossMatch ? parseInt(lossMatch[1]) : null;

                    if (loss === 0) {
                        log.success(`${lang.PING_SERVER_OK} (0% packet loss)`);
                    } else if (loss < 50) {
                        log.warn(
                            `${lang.PING_SERVER_WARN} (${loss}% packet loss)`
                        );
                    } else {
                        log.error(
                            `${lang.PING_SERVER_FAIL} (${loss}% packet loss)`
                        );
                    }
                }

                if (rttLine) {
                    const rttMatch = rttLine.match(
                        /rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/
                    );
                    if (rttMatch) {
                        const [, min, avg, max] = rttMatch;
                        log.info(
                            `RTT: min=${min}ms, avg=${avg}ms, max=${max}ms`
                        );
                    }
                }

                conn.end();
            });
        });
    }).connect({ host: ip, username, password });
};
