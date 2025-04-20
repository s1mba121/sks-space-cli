const { loadProjectConfig } = require("../../services/projectConfig");
const { configExists } = require("../../services/projectConfig");
const { execSync } = require("child_process");
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
    const env = process.argv.includes("--prod") ? "prod" : "dev";

    if (!(await configExists(env))) {
        log.error(lang.CONFIG_NOT_FOUND(env));
        process.exit(1);
    }

    const config = await loadProjectConfig(env);
    const { ip, username } = config.server;
    const { remotePath } = config.deploy;
    const { port } = config.nginx || { port: 3000 };

    const sshCommand = `ssh -i ~/.ssh/id_rsa ${username}@${ip} 'cd ${remotePath} && ./start-server.sh'`;

    try {
        execSync(sshCommand, { stdio: "inherit" });
        log.success(lang.SERVER_STARTED(port));
    } catch (err) {
        log.error(lang.SERVER_START_FAILED(err.message));
    }
};
