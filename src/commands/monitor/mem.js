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
        log.error(lang.MEM_CONFIG_ERROR);
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        log.error(lang.MEM_PASSWORD_ERROR);
        return;
    }

    const conn = new Client();

    conn.on("ready", async () => {
        try {
            log.info(lang.MEM_CHECK_START);

            const memRaw = await execCommand(
                conn,
                `free -m | awk 'NR==2{printf "%s %s %s", $2,$3,$4}'`
            );
            const [total, used, free] = memRaw.split(" ").map(Number);
            const percent = ((used / total) * 100).toFixed(2);

            let percentColor = chalk.green(`${percent}%`);
            if (percent > 70) percentColor = chalk.yellow(`${percent}%`);
            if (percent > 90) percentColor = chalk.red(`${percent}%`);

            log.section("Memory Usage");

            const table = new Table({
                head: [
                    chalk.blue("Total MB"),
                    chalk.blue("Used MB"),
                    chalk.blue("Free MB"),
                    chalk.blue("Usage"),
                ],
                colWidths: [15, 15, 15, 15],
            });

            table.push([total, used, free, percentColor]);
            console.log(table.toString());

            log.section("Top 5 Processes by Memory");

            const topProcs = await execCommand(
                conn,
                `ps aux --sort=-%mem | head -n 6 | awk '{printf "%-15s %-8s %-8s %-8s\\n", $11, $2, $4, $5}'`
            );

            const procTable = new Table({
                head: [
                    chalk.blue("Process"),
                    chalk.blue("PID"),
                    chalk.blue("%MEM"),
                    chalk.blue("RSS KB"),
                ],
                colWidths: [25, 10, 10, 15],
            });

            topProcs.split("\n").forEach((line) => {
                const parts = line.trim().split(/\s+/);
                if (parts.length === 4) procTable.push(parts);
            });

            console.log(procTable.toString());
            log.success(lang.MEM_DONE);
        } catch (err) {
            log.error(`${lang.MEM_COMMAND_ERROR}: ${err.message}`);
        } finally {
            conn.end();
        }
    });

    conn.on("error", (err) => {
        log.error(`${lang.MEM_CONNECTION_ERROR}: ${err.message}`);
    });

    conn.connect({ host: ip, username, password });
};
