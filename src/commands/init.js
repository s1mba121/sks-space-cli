const { default: inquirer } = require("inquirer");
const path = require("path");
const fs = require("fs-extra");
const { saveProjectConfig } = require("../services/projectConfig");
const { loadConfig } = require("../services/config");

const chalk = require("chalk");

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

module.exports = {
    description: "Инициализировать проект с конфигурацией деплоя",
    action: async () => {
        const saved = await loadConfig();
        const cwdName = path.basename(process.cwd());

        const { envType } = await inquirer.prompt([
            {
                type: "list",
                name: "envType",
                message: "Какую среду настраиваем?",
                choices: [
                    { name: "Разработка (dev)", value: "dev" },
                    { name: "Продакшен (production)", value: "prod" }
                ]
            }
        ]);

        const configPath = `.space.${envType}.json`;
        const exists = await fs.pathExists(configPath);

        if (exists) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "overwrite",
                    message: `Файл ${configPath} уже существует. Перезаписать?`,
                    default: false
                }
            ]);

            if (!overwrite) {
                log.warn("Отмена инициализации.");
                return;
            }
        }

        const { ip, username, projectName, projectType } = await inquirer.prompt([
            {
                type: "input",
                name: "ip",
                message: "IP сервера:",
                default: saved?.ip || undefined
            },
            {
                type: "input",
                name: "username",
                message: "Пользователь:",
                default: saved?.username || undefined
            },
            {
                type: "input",
                name: "projectName",
                message: "Имя проекта:",
                default: cwdName
            },
            {
                type: "list",
                name: "projectType",
                message: "Тип проекта:",
                choices: [
                    { name: "Single Page App (React/Vue)", value: "spa" },
                    { name: "Node.js Backend", value: "node" },
                    { name: "Static HTML", value: "static" },
                ]
            }
        ]);

        const pathMap = {
            spa: `/var/www/spa/${projectName}`,
            node: `/var/www/node/${projectName}`,
            static: `/var/www/static/${projectName}`,
        };

        let buildCommand = null;
        let defaultLocalPath = "dist";

        if (projectType === "node") {
            defaultLocalPath = ".";
            log.info("Node.js проект: команда сборки не требуется.");
        } else {
            let detectedBuild = null;
            try {
                const pkg = await fs.readJson("package.json");
                if (pkg.scripts?.build) {
                    detectedBuild = "npm run build";
                }
            } catch { }

            const buildPrompt = await inquirer.prompt([
                {
                    type: "input",
                    name: "buildCommand",
                    message: "Команда сборки:",
                    default: detectedBuild || ""
                }
            ]);

            buildCommand = buildPrompt.buildCommand;
        }

        const { localPath, remotePath, preDeploy, postDeploy } = await inquirer.prompt([
            {
                type: "input",
                name: "localPath",
                message: "Путь к локальной папке (build/dist):",
                default: defaultLocalPath
            },
            {
                type: "input",
                name: "remotePath",
                message: "Путь на сервере:",
                default: pathMap[projectType] || `~/sites/${projectName}`
            },
            {
                type: "input",
                name: "preDeploy",
                message: "Команда перед деплоем (опционально):"
            },
            {
                type: "input",
                name: "postDeploy",
                message: "Команда после деплоя (опционально):"
            }
        ]);

        let includeEnv = false;
        const envPath = path.join(process.cwd(), ".env");
        if (await fs.pathExists(envPath)) {
            const { loadEnv } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "loadEnv",
                    message: "Обнаружен .env файл. Загружать его при деплое?",
                    default: true
                }
            ]);
            includeEnv = loadEnv;
        }

        let nginx = null;

        const { nginxAlreadyConfigured } = await inquirer.prompt([
            {
                type: "confirm",
                name: "nginxAlreadyConfigured",
                message: "Nginx уже настроен для этого проекта?",
                default: false
            }
        ]);

        if (!nginxAlreadyConfigured) {
            const { wantsNginx } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "wantsNginx",
                    message: "Настроить домен и Nginx?",
                    default: envType === "prod"
                }
            ]);

            if (wantsNginx) {
                nginx = await inquirer.prompt([
                    {
                        type: "input",
                        name: "domain",
                        message: "Основной домен (example.com):"
                    },
                    ...(envType === "dev" ? [
                        {
                            type: "input",
                            name: "subdomain",
                            message: "Субдомен для dev (например, dev):",
                            default: "dev"
                        },
                        {
                            type: "input",
                            name: "port",
                            message: "Локальный порт приложения (например, 3000):",
                            default: 3000
                        }
                    ] : [
                        {
                            type: "input",
                            name: "port",
                            message: "Локальный порт приложения (например, 3000):"
                        }
                    ]),
                    {
                        type: "confirm",
                        name: "ssl",
                        message: "Настроить HTTPS (Let's Encrypt)?",
                        default: true
                    }
                ]);

                const serverName = envType === "dev"
                    ? `${nginx.subdomain}.${nginx.domain}`
                    : nginx.domain;

                const nginxConf = `
server {
    listen 80;
    server_name ${serverName};

    location / {
        proxy_pass http://localhost:${nginx.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    ${nginx.ssl ? `
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/${serverName}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${serverName}/privkey.pem;
    ` : ""}
}
                `.trim();

                const nginxPath = `nginx.${envType}.conf`;
                await fs.writeFile(nginxPath, nginxConf);
                log.success(`Конфигурация Nginx сохранена в ${nginxPath}`);
            }
        } else {
            nginx = await inquirer.prompt([
                {
                    type: "input",
                    name: "domain",
                    message: "Основной домен (example.com):"
                },
                ...(envType === "dev" ? [
                    {
                        type: "input",
                        name: "subdomain",
                        message: "Субдомен для dev (например, dev):",
                        default: "dev"
                    }
                ] : []),
                {
                    type: "input",
                    name: "port",
                    message: "Локальный порт приложения (например, 3000):",
                    default: 3000
                }
            ]);
        }

        const ignored = [
            ".git",
            "node_modules",
            "package-lock.json",
            "yarn.lock",
            "npm-debug.log",
            "yarn-error.log",
            ".DS_Store"
        ];

        const config = {
            project: {
                name: projectName,
                type: projectType,
                buildCommand: buildCommand || null
            },
            server: { ip, username },
            deploy: {
                localPath,
                remotePath,
                preDeploy: preDeploy || null,
                postDeploy: postDeploy || null,
                includeEnv
            },
            nginx: nginx || null,
            ignored
        };

        await saveProjectConfig(config, envType);
        log.success(`Конфигурация .space.${envType}.json успешно создана!`);
    }
};
