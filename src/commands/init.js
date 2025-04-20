const { default: inquirer } = require("inquirer");
const path = require("path");
const fs = require("fs-extra");
const { saveProjectConfig } = require("../services/projectConfig");
const { loadConfig } = require("../services/config");
const { getLangObject } = require("../services/lang");

const lang = getLangObject();

const chalk = require("chalk");

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

        const configPath = `.space.${envType}.json`;
        const exists = await fs.pathExists(configPath);

        if (exists) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "overwrite",
                    message: `${lang.FILE_EXISTS} ${configPath}. ${lang.OVERWRITE_CONFIRM}`,
                    default: false,
                },
            ]);

            if (!overwrite) {
                log.warn(lang.CANCEL_INIT);
                return;
            }
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
                        { name: lang.SPA_TYPE, value: "spa" },
                        { name: lang.NODE_TYPE, value: "node" },
                        { name: lang.STATIC_TYPE, value: "static" },
                    ],
                },
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

        let nginx = null;

        const { nginxAlreadyConfigured } = await inquirer.prompt([
            {
                type: "confirm",
                name: "nginxAlreadyConfigured",
                message: lang.PROMPT_NGINX_CONFIGURED,
                default: false,
            },
        ]);

        if (!nginxAlreadyConfigured) {
            const { wantsNginx } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "wantsNginx",
                    message: lang.PROMPT_NGINX_SETUP,
                    default: envType === "prod",
                },
            ]);

            if (wantsNginx) {
                nginx = await inquirer.prompt([
                    {
                        type: "input",
                        name: "domain",
                        message: lang.PROMPT_DOMAIN,
                    },
                    ...(envType === "dev"
                        ? [
                              {
                                  type: "input",
                                  name: "subdomain",
                                  message: lang.PROMPT_SUBDOMAIN,
                                  default: "dev",
                              },
                              {
                                  type: "input",
                                  name: "port",
                                  message: lang.PROMPT_PORT,
                                  default: 3000,
                              },
                          ]
                        : [
                              {
                                  type: "input",
                                  name: "port",
                                  message: lang.PROMPT_PORT,
                              },
                          ]),
                    {
                        type: "confirm",
                        name: "ssl",
                        message: lang.PROMPT_SSL,
                        default: true,
                    },
                ]);

                const serverName =
                    envType === "dev"
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

    ${
        nginx.ssl
            ? `
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/${serverName}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${serverName}/privkey.pem;
    `
            : ""
    }
}
                `.trim();

                const nginxPath = `nginx.${envType}.conf`;
                await fs.writeFile(nginxPath, nginxConf);
                log.success(`${lang.NGINX_CONFIG_SAVED} ${nginxPath}`);
            }
        } else {
            nginx = await inquirer.prompt([
                {
                    type: "input",
                    name: "domain",
                    message: lang.PROMPT_DOMAIN,
                },
                ...(envType === "dev"
                    ? [
                          {
                              type: "input",
                              name: "subdomain",
                              message: lang.PROMPT_SUBDOMAIN,
                              default: "dev",
                          },
                      ]
                    : []),
                {
                    type: "input",
                    name: "port",
                    message: lang.PROMPT_PORT,
                    default: 3000,
                },
            ]);
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

        const config = {
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
            nginx: nginx || null,
            ignored,
        };

        await saveProjectConfig(config, envType);
        log.success(`${lang.CONFIG_CREATED} .space.${envType}.json!`);
    },
};
