const { Client } = require("ssh2");
const { execSync } = require("child_process");
const chalk = require("chalk");
const { getLangObject } = require("./lang");
const os = require("os");

const lang = getLangObject();

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

function runSSHCommand(conn, command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            stream.on("close", (code) => {
                resolve(code === 0);
            });
        });
    });
}

async function setupServer(ip, username, password, type) {
    const createDirs = {
        spa: ["mkdir -p /var/www/spa"],
        node: ["mkdir -p /var/www/node"],
        static: ["mkdir -p /var/www/static"],
    };

    const commands = createDirs[type];

    if (!commands) {
        log.error(lang.UNKNOWN_PROJECT_TYPE);
        return;
    }

    log.info(lang.SETTING_UP_SERVER);

    try {
        for (const cmd of commands) {
            if (process.platform === "win32") {
                const psCommand = `ssh ${username}@${ip} "${cmd}"`;
                execSync(`powershell -Command "${psCommand}"`, {
                    stdio: "ignore",
                });
            } else {
                const sshCommand = `ssh -o StrictHostKeyChecking=no ${username}@${ip} "${cmd}"`;
                execSync(sshCommand, { stdio: "ignore" });
            }
        }
        log.success(lang.SERVER_SETUP_SUCCESS);
    } catch (err) {
        log.error(lang.SERVER_SETUP_ERROR);
        throw err;
    }
}

function testConnection(ip, username, password) {
    return new Promise((resolve) => {
        const conn = new Client();

        conn.on("ready", () => {
            conn.end();
            resolve(true);
        })
            .on("error", (err) => {
                log.error(`${lang.CONNECTION_ERROR}: ${err.message}`);
                resolve(false);
            })
            .connect({
                host: ip,
                username,
                password,
                readyTimeout: 5000,
            });
    });
}

function sshConnect(ip, username) {
    const { spawn } = require("child_process");
    spawn("ssh", [`${username}@${ip}`], { stdio: "inherit" });
}

function sshConnectWithKey(ip, username, command) {
    const sshCommand = `ssh -o StrictHostKeyChecking=no ${username}@${ip} "${command}"`;
    execSync(sshCommand, { stdio: "inherit" });
}

module.exports = {
    testConnection,
    setupServer,
    sshConnect,
    sshConnectWithKey,
};
