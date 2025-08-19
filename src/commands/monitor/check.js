const { Client } = require("ssh2");
const { loadConfig } = require("../../services/config");
const { getPassword } = require("../../services/keyring");
const { getLangObject } = require("../../services/lang");
const chalk = require("chalk");
const Table = require("cli-table3");

const lang = getLangObject();

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            let data = "";
            let error = "";

            stream.on("data", (chunk) => (data += chunk.toString()));
            stream.stderr.on("data", (chunk) => (error += chunk.toString()));

            stream.on("close", () => {
                if (error) return reject(new Error(error));
                resolve(data.trim());
            });
        });
    });
}

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

    conn.on("ready", async () => {
        try {
            log.info(lang.CHECK_START);

            const services = ["nginx", "node"];
            let serviceResults = [];

            for (const srv of services) {
                try {
                    const status = await execCommand(
                        conn,
                        `systemctl is-active ${srv}`
                    );
                    serviceResults.push({
                        service: srv,
                        status:
                            status === "active"
                                ? chalk.green("running")
                                : chalk.red(status),
                    });
                } catch (e) {
                    serviceResults.push({
                        service: srv,
                        status: chalk.red("not found"),
                    });
                }
            }

            const cpu = await execCommand(
                conn,
                `top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'`
            );
            const mem = await execCommand(
                conn,
                `free -m | awk 'NR==2{printf "%s/%s MB (%.2f%%)", $3,$2,$3*100/$2 }'`
            );
            const disk = await execCommand(
                conn,
                `df -h --total | grep total | awk '{print $3 "/" $2 " (" $5 ")"}'`
            );
            const uptime = await execCommand(conn, `uptime -p`);

            log.section("Server Health");

            const table = new Table({
                head: [chalk.blue("Check"), chalk.blue("Result")],
                colWidths: [20, 50],
            });

            serviceResults.forEach((srv) =>
                table.push([`Service: ${srv.service}`, srv.status])
            );
            table.push([`CPU Load`, `${cpu.trim()} %`]);
            table.push([`Memory Usage`, mem]);
            table.push([`Disk Usage`, disk]);
            table.push([`Uptime`, uptime]);

            console.log(table.toString());
            log.success(lang.CHECK_DONE);
        } catch (err) {
            log.error(`${lang.CHECK_COMMAND_ERROR}: ${err.message}`);
        } finally {
            conn.end();
        }
    });

    conn.on("error", (err) => {
        log.error(`${lang.CHECK_CONNECTION_ERROR}: ${err.message}`);
    });

    conn.connect({ host: ip, username, password });
};
