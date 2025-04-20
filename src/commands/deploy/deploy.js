// commands/deploy.js
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const {
    configExists,
    loadProjectConfig,
} = require("../../services/projectConfig");
const { sshConnectWithKey } = require("../../services/ssh");
const { buildProject } = require("../../services/build");
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

async function ensureRsyncInstalled() {
    try {
        execSync("rsync --version", { stdio: "ignore" });
    } catch (err) {
        log.warn(lang.RSYNC_INSTALLING);

        const platform = os.platform();
        try {
            if (platform === "darwin") {
                execSync("brew install rsync", { stdio: "inherit" });
            } else if (platform === "linux") {
                try {
                    execSync("apt-get --version", { stdio: "ignore" });
                    execSync(
                        "sudo apt-get update && sudo apt-get install -y rsync",
                        { stdio: "inherit" }
                    );
                } catch {
                    execSync("sudo yum install -y rsync", { stdio: "inherit" });
                }
            } else {
                log.error(lang.RSYNC_UNSUPPORTED);
                process.exit(1);
            }
        } catch (installError) {
            log.error(`${lang.RSYNC_FAILED}: ${installError.message}`);
            process.exit(1);
        }
    }
}

async function deployToServer(config) {
    const { ip, username } = config.server;
    const { localPath, remotePath, preDeploy, postDeploy, includeEnv } =
        config.deploy;
    const { ignored = [] } = config;
    const { type } = config.project;

    log.section(lang.DEPLOY_START(config.project.name, ip));

    if (config.project.buildCommand) {
        await buildProject(config.project.buildCommand);
    }

    if (preDeploy) {
        log.warn(lang.RUNNING_PREDEPLOY(preDeploy));
        execSync(preDeploy, { stdio: "inherit" });
    }

    log.info(lang.REMOVING_OLD_DIR(remotePath));
    await sshConnectWithKey(
        ip,
        username,
        `rm -rf ${remotePath} && mkdir -p ${remotePath}`
    );

    const excludeFlags = (ignored || [])
        .map((item) =>
            item.endsWith("/") ? `--exclude='${item}*'` : `--exclude='${item}'`
        )
        .join(" ");

    // === Генерация start-server.sh ===
    let port = config.nginx?.port || 4000;

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

    fs.writeFileSync(
        path.join(localPath, "start-server.sh"),
        startScriptContent,
        { mode: 0o755 }
    );
    log.success(lang.SCRIPT_GENERATED);

    log.info(lang.SCANNING_FILES);
    const rsyncDryRunCmd = `rsync -avzn ${excludeFlags} -e "ssh -i ~/.ssh/id_rsa" ${localPath}/ ${username}@${ip}:${remotePath}`;
    const output = execSync(rsyncDryRunCmd).toString();
    const fileList = output
        .split("\n")
        .filter(
            (line) =>
                line.trim() &&
                !line.startsWith("sending") &&
                !line.startsWith("sent") &&
                !line.startsWith("total size") &&
                !line.startsWith("./")
        );

    log.info(lang.UPLOADING_FILES(fileList.length));

    const rsyncCommand = `rsync -az ${excludeFlags} -e "ssh -i ~/.ssh/id_rsa" ${localPath}/ ${username}@${ip}:${remotePath}`;
    execSync(rsyncCommand, { stdio: "ignore" });

    if (includeEnv && fs.existsSync(path.join(localPath, ".env"))) {
        log.info(lang.UPLOADING_ENV);
        const envCmd = `rsync -az -e "ssh -i ~/.ssh/id_rsa" ${path.join(localPath, ".env")} ${username}@${ip}:${remotePath}/.env`;
        execSync(envCmd, { stdio: "ignore" });
    }

    log.info(lang.RESTARTING_SERVER(port));
    const sshCommand = `ssh -i ~/.ssh/id_rsa ${username}@${ip} 'cd ${remotePath} && chmod +x start-server.sh && ./start-server.sh'`;

    try {
        execSync(sshCommand, { stdio: "ignore" });
    } catch (err) {
        log.error(`✗ ${err.message}`);
        throw err;
    }

    if (postDeploy) {
        log.warn(lang.RUNNING_POSTDEPLOY(postDeploy));
        execSync(postDeploy, { stdio: "inherit" });
    }

    const finalURL = config.nginx
        ? `https://${config.nginx.subdomain ? config.nginx.subdomain + "." : ""}${config.nginx.domain}`
        : `http://${ip}:${port}`;

    log.success(lang.DEPLOY_SUCCESS);
    log.ip(lang.ACCESSIBLE_AT(chalk.underline(finalURL)));
}

module.exports = async () => {
    const env = process.argv.includes("--prod") ? "prod" : "dev";

    if (!(await configExists(env))) {
        console.log(`[!] ${lang.NEED_CONNECT}`);
        return require("./init").action(env);
    }

    await ensureRsyncInstalled();

    const config = await loadProjectConfig(env);
    await deployToServer(config);
};
