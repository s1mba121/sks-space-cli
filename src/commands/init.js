const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const { saveProjectConfig } = require("../services/projectConfig");
const { loadConfig } = require("../services/config");
const { getLangObject } = require("../services/lang");
const { spaceIcon } = require("../commands/spaceIcon");

const lang = getLangObject();

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

module.exports = {
    description: lang.INIT_PROJECT_DESC,
    action: async () => {
        const inquirer = await import("inquirer").then((mod) => mod.default);
        const saved = await loadConfig();
        const cwdName = path.basename(process.cwd());

        const { envType } = await inquirer.prompt([
            {
                type: "list",
                name: "envType",
                message: lang.SELECT_ENV,
                choices: [
                    { name: lang.DEV_ENV, value: "dev" },
                    { name: lang.PROD_ENV, value: "prod" },
                ],
            },
        ]);

        const configPath = `.space.json`;
        let existingConfig = {};
        if (await fs.pathExists(configPath)) {
            existingConfig = await fs.readJson(configPath);
        }

        const { ip, username, projectName, projectType } =
            await inquirer.prompt([
                {
                    type: "input",
                    name: "ip",
                    message: lang.PROMPT_IP,
                    default: saved?.ip || undefined,
                },
                {
                    type: "input",
                    name: "username",
                    message: lang.PROMPT_USER,
                    default: saved?.username || undefined,
                },
                {
                    type: "input",
                    name: "projectName",
                    message: lang.PROMPT_PROJECT_NAME,
                    default: cwdName,
                },
                {
                    type: "list",
                    name: "projectType",
                    message: lang.PROMPT_PROJECT_TYPE,
                    choices: [
                        { name: lang.SPA_TYPE, value: "vite" },
                        { name: lang.NODE_TYPE, value: "node" },
                        { name: lang.STATIC_TYPE, value: "static" },
                    ],
                },
            ]);

        const pathMap = {
            spa: `/var/www/spa/${projectName}`,
            vite: `/var/www/spa/${projectName}`,
            node: `/var/www/node/${projectName}`,
            static: `/var/www/static/${projectName}`,
        };

        let buildCommand = null;
        let defaultLocalPath = "dist";

        if (projectType === "node") {
            defaultLocalPath = ".";
            log.info(lang.NODE_PROJECT_INFO);
        } else {
            let detectedBuild = null;
            try {
                const pkg = await fs.readJson("package.json");
                if (pkg.scripts?.build) {
                    detectedBuild = "npm run build";
                }
            } catch {}

            const buildPrompt = await inquirer.prompt([
                {
                    type: "input",
                    name: "buildCommand",
                    message: lang.PROMPT_BUILD_COMMAND,
                    default: detectedBuild || "",
                },
            ]);
            buildCommand = buildPrompt.buildCommand;
        }

        const { localPath, remotePath, preDeploy, postDeploy } =
            await inquirer.prompt([
                {
                    type: "input",
                    name: "localPath",
                    message: lang.PROMPT_LOCAL_PATH,
                    default: defaultLocalPath,
                },
                {
                    type: "input",
                    name: "remotePath",
                    message: lang.PROMPT_REMOTE_PATH,
                    default: pathMap[projectType] || `~/sites/${projectName}`,
                },
                {
                    type: "input",
                    name: "preDeploy",
                    message: lang.PROMPT_PRE_DEPLOY,
                },
                {
                    type: "input",
                    name: "postDeploy",
                    message: lang.PROMPT_POST_DEPLOY,
                },
            ]);

        let includeEnv = false;
        const envPath = path.join(process.cwd(), ".env");
        if (await fs.pathExists(envPath)) {
            const { loadEnv } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "loadEnv",
                    message: lang.PROMPT_LOAD_ENV,
                    default: true,
                },
            ]);
            includeEnv = loadEnv;
        }

        let domain = null;
        let subdomain = null;
        let port = null;

        const { hasDomain } = await inquirer.prompt([
            {
                type: "confirm",
                name: "hasDomain",
                message: lang.PROMPT_HAS_DOMAIN,
                default: false,
            },
        ]);

        if (hasDomain) {
            const domainAnswers = await inquirer.prompt([
                {
                    type: "input",
                    name: "domain",
                    message: lang.PROMPT_DOMAIN,
                },
                {
                    type: "confirm",
                    name: "useSubdomain",
                    message: lang.PROMPT_USE_SUBDOMAIN,
                    default: envType === "dev",
                },
                {
                    type: "input",
                    name: "port",
                    message: lang.PROMPT_PORT,
                    default: 3000,
                    validate: (value) => {
                        const n = Number(value);
                        return (
                            (Number.isInteger(n) && n >= 1 && n <= 65535) ||
                            "Port must be a number between 1 and 65535."
                        );
                    },
                },
            ]);

            domain = domainAnswers.domain;
            port = parseInt(domainAnswers.port, 10);

            if (domainAnswers.useSubdomain) {
                const { sub } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "sub",
                        message: lang.PROMPT_SUBDOMAIN,
                        default: "dev",
                    },
                ]);
                subdomain = sub;
            }
        }

        const ignored = [
            ".git",
            "node_modules",
            "package-lock.json",
            "yarn.lock",
            "npm-debug.log",
            "yarn-error.log",
            ".DS_Store",
        ];

        const newConfig = {
            project: {
                name: projectName,
                type: projectType,
                buildCommand: buildCommand || null,
            },
            server: { ip, username },
            deploy: {
                localPath,
                remotePath,
                preDeploy: preDeploy || null,
                postDeploy: postDeploy || null,
                includeEnv,
            },
            domain: domain
                ? { domain, subdomain: subdomain || null, port }
                : null,
            ignored,
        };

        const mergedConfig = {
            ...existingConfig,
            [envType]: newConfig,
        };

        log.section(lang.CONFIG_PREVIEW);
        console.log(chalk.gray(JSON.stringify(mergedConfig, null, 2)));

        const { confirmSave } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmSave",
                message: lang.CONFIRM_SAVE,
                default: true,
            },
        ]);

        if (!confirmSave) {
            log.warn(lang.CANCEL_INIT);
            return;
        }

        await fs.writeJson(configPath, mergedConfig, { spaces: 2 });
        log.success(`${lang.CONFIG_CREATED} ${configPath}!`);
        await spaceIcon();
    },
};
