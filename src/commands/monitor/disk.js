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
        log.error(lang.DISK_CONFIG_ERROR);
        return;
    }

    const { ip, username } = config;
    const password = await getPassword(username);

    if (!password) {
        log.error(lang.DISK_PASSWORD_ERROR);
        return;
    }

    const conn = new Client();

    conn.on("ready", async () => {
        try {
            log.info(lang.DISK_CHECK_START);

            const dfRaw = await execCommand(
                conn,
                `df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs`
            );
            const lines = dfRaw.split("\n").slice(1);
            const table = new Table({
                head: [
                    chalk.blue("Filesystem"),
                    chalk.blue("Size"),
                    chalk.blue("Used"),
                    chalk.blue("Avail"),
                    chalk.blue("Use%"),
                    chalk.blue("Mounted on"),
                ],
                colWidths: [20, 10, 10, 10, 10, 25],
            });

            lines.forEach((line) => {
                const parts = line.trim().split(/\s+/);
                if (parts.length === 6) {
                    const [fs, size, used, avail, pcent, mount] = parts;
                    const usageNum = parseInt(pcent.replace("%", ""), 10);

                    let usageColor = chalk.green(pcent);
                    if (usageNum > 70) usageColor = chalk.yellow(pcent);
                    if (usageNum > 90) usageColor = chalk.red(pcent);

                    table.push([fs, size, used, avail, usageColor, mount]);
                }
            });

            log.section("Disk Usage");
            console.log(table.toString());

            const inodesRaw = await execCommand(
                conn,
                `df -i -x tmpfs -x devtmpfs`
            );
            const inodeLines = inodesRaw.split("\n").slice(1);

            const inodeTable = new Table({
                head: [
                    chalk.blue("Filesystem"),
                    chalk.blue("Inodes"),
                    chalk.blue("Used"),
                    chalk.blue("Free"),
                    chalk.blue("IUse%"),
                    chalk.blue("Mounted on"),
                ],
                colWidths: [20, 12, 12, 12, 10, 25],
            });

            inodeLines.forEach((line) => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 6) {
                    const [fs, total, used, avail, pcent, mount] = parts;
                    const usageNum = parseInt(pcent.replace("%", ""), 10);

                    let usageColor = chalk.green(pcent);
                    if (usageNum > 70) usageColor = chalk.yellow(pcent);
                    if (usageNum > 90) usageColor = chalk.red(pcent);

                    inodeTable.push([
                        fs,
                        total,
                        used,
                        avail,
                        usageColor,
                        mount,
                    ]);
                }
            });

            log.section("Inodes Usage");
            console.log(inodeTable.toString());

            log.section("Top 5 Directories by Size (/)");
            const duRaw = await execCommand(
                conn,
                `du -h -d1 / 2>/dev/null | sort -hr | head -n 5`
            );
            console.log(chalk.gray(duRaw));

            log.success(lang.DISK_DONE);
        } catch (err) {
            log.error(`${lang.DISK_COMMAND_ERROR}: ${err.message}`);
        } finally {
            conn.end();
        }
    });

    conn.on("error", (err) => {
        log.error(`${lang.DISK_CONNECTION_ERROR}: ${err.message}`);
    });

    conn.connect({ host: ip, username, password });
};
