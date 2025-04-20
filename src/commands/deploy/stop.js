const { loadProjectConfig, configExists } = require("../../services/projectConfig");
const { execSync } = require("child_process");
const chalk = require("chalk");

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
        log.error(`Конфигурация .space.${env}.json не найдена`);
        process.exit(1);
    }

    const config = await loadProjectConfig(env);
    const { ip, username } = config.server;

    let port = 3000;
    if (config.nginx) {
        port = config.nginx.port || 3000;
    }

    const sshCommand = `ssh -i ~/.ssh/id_rsa ${username}@${ip} 'fuser -k ${port}/tcp || true'`;

    try {
        execSync(sshCommand, { stdio: "inherit" });
        log.success(`Сервер на порту ${port} остановлен`);
    } catch (err) {
        log.error(`Не удалось остановить сервер: ${err.message}`);
    }
};
