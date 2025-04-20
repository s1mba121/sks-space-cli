const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { execSync, exec } = require("child_process");
const { configExists, loadProjectConfig } = require("../../services/projectConfig");
const { sshConnectWithKey } = require("../../services/ssh");
const { buildProject } = require("../../services/build");
const chalk = require("chalk");

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
    ip: (msg) => console.log(chalk.whiteBright(`\n${msg} \n`)),
};

async function ensureRsyncInstalled() {
    try {
        execSync("rsync --version", { stdio: "ignore" });
    } catch (err) {
        log.warn("rsync не найден. Устанавливаем...");

        const platform = os.platform();
        try {
            if (platform === "darwin") {
                execSync("brew install rsync", { stdio: "inherit" });
            } else if (platform === "linux") {
                try {
                    execSync("apt-get --version", { stdio: "ignore" });
                    execSync("sudo apt-get update && sudo apt-get install -y rsync", { stdio: "inherit" });
                } catch {
                    execSync("sudo yum install -y rsync", { stdio: "inherit" });
                }
            } else {
                log.error("Автоустановка rsync не поддерживается на этой системе. Установите вручную.");
                process.exit(1);
            }
        } catch (installError) {
            log.error(`Не удалось установить rsync автоматически: ${installError.message}`);
            process.exit(1);
        }
    }
}

async function deployToServer(config) {
    const { ip, username } = config.server;
    const { localPath, remotePath, preDeploy, postDeploy, includeEnv } = config.deploy;
    const { ignored = [] } = config;
    const { type } = config.project;

    log.section(`Деплой проекта ${config.project.name} на сервер ${ip}`);

    const buildCommand = config.project.buildCommand;
    if (buildCommand) {
        await buildProject(buildCommand);
    }

    if (preDeploy) {
        log.warn(`Выполняем preDeploy команду: ${preDeploy}`);
        execSync(preDeploy, { stdio: "inherit" });
    }

    log.info(`Удаляем старую директорию на сервере: ${remotePath}`);
    await sshConnectWithKey(ip, username, `rm -rf ${remotePath} && mkdir -p ${remotePath}`);

    const processedIgnores = ignored.map(item => {
        if (item.endsWith("/")) {
            return `--exclude='${item}*'`;
        }
        return `--exclude='${item}'`;
    });
    const excludeFlags = processedIgnores.join(" ");

    // === Генерация start-server.sh ===
    let port = 4000;
    if (config.nginx) {
        port = config.nginx.port || 3000;
    }

    let startScriptContent = `#!/bin/bash
PORT=${port}
cd $(dirname "$0")
fuser -k $PORT/tcp || true
`;

    if (type === "node") {
        startScriptContent += `npm install --production\n`;
        startScriptContent += `nohup node server.js </dev/null > app.log 2>&1 &\n`;
    } else {
        startScriptContent += `nohup npx http-server -p $PORT </dev/null > http-server.log 2>&1 &\n`;
    }

    const scriptPath = path.join(localPath, "start-server.sh");
    fs.writeFileSync(scriptPath, startScriptContent, { mode: 0o755 });
    log.success(`Скрипт start-server.sh сгенерирован.`);

    log.info(`Сканируем файлы для загрузки...`);
    const rsyncDryRunCmd = `rsync -avzn ${excludeFlags} -e "ssh -i ~/.ssh/id_rsa" ${localPath}/ ${username}@${ip}:${remotePath}`;
    const output = execSync(rsyncDryRunCmd).toString();

    const fileList = output
        .split("\n")
        .filter(line =>
            line.trim() &&
            !line.startsWith("sending") &&
            !line.startsWith("sent") &&
            !line.startsWith("total size") &&
            !line.startsWith("./")
        );

    log.info(`Загружаем ${fileList.length} файл(ов):`);

    const rsyncRealCommand = `rsync -az ${excludeFlags} -e "ssh -i ~/.ssh/id_rsa" ${localPath}/ ${username}@${ip}:${remotePath}`;
    execSync(rsyncRealCommand, { stdio: "ignore" });



    if (includeEnv && fs.existsSync(path.join(localPath, ".env"))) {
        log.info("Загружаем .env файл...");
        const envUploadCommand = `rsync -az -e "ssh -i ~/.ssh/id_rsa" ${path.join(localPath, ".env")} ${username}@${ip}:${remotePath}/.env`;
        execSync(envUploadCommand, { stdio: "ignore" });
    }

    log.info(`Перезапускаем http-server на порту ${port}...\n`);
    const sshCommand = `ssh -i ~/.ssh/id_rsa ${username}@${ip} 'cd ${remotePath} && chmod +x start-server.sh && ./start-server.sh'`;

    try {
        execSync(sshCommand, { stdio: "ignore" });
    } catch (err) {
        log.error(`Ошибка при запуске скрипта: ${err.message}`);
        throw err;
    }

    const finalURL = config.nginx
        ? `https://${config.nginx.subdomain ? config.nginx.subdomain + '.' : ''}${config.nginx.domain}`
        : `http://${ip}:${port}`;

    if (postDeploy) {
        log.warn(`Выполняем postDeploy команду: ${postDeploy}\n`);
        execSync(postDeploy, { stdio: "inherit" });
    }

    log.success(`Проект успешно задеплоен!`);
    log.ip(`Доступен по адресу: ${chalk.underline(finalURL)}\n`);
}


module.exports = async () => {
    const env = process.argv.includes("--prod") ? "prod" : "dev";

    if (!(await configExists(env))) {
        console.log(`[!] Конфигурация .space.${env}.json не найдена, запускаем init...`);
        return require("../init").action(env);
    }

    await ensureRsyncInstalled();

    const config = await loadProjectConfig(env);
    await deployToServer(config);
};
