#!/usr/bin/env node
const { program, Command } = require("commander");
const chalk = require("chalk");
const { saveLang, getLangObject } = require("../src/services/lang");
const { spaceIcon } = require("../src/commands/spaceIcon");

const lang = getLangObject();

const log = {
    info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
    success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
    error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
    section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

const langArgIndex = process.argv.findIndex(
    (arg) => arg === "--lang" || arg === "-l"
);
if (langArgIndex !== -1 && process.argv[langArgIndex + 1]) {
    const langCode = process.argv[langArgIndex + 1].toLowerCase();
    if (["ru", "en"].includes(langCode)) {
        saveLang(langCode);
        console.log(`Language switched to ${langCode.toUpperCase()}`);
        process.exit(0);
    } else {
        console.error("Unsupported language. Use 'En' or 'Ru'.");
        process.exit(1);
    }
}

const isConnected = require("../src/utils/isConnected");

async function withConnectionCheck(handler) {
    return async (...args) => {
        const connected = await isConnected();
        if (!connected) {
            log.error(lang.NEED_CONNECT);
            process.exit(1);
        }
        return handler(...args);
    };
}

program
    .command("icon")
    .description("Добавить иконку для .space.json в VS Code")
    .action(async () => {
        await spaceIcon();
    });

program
    .command("connect")
    .description(lang.CONNECT_DESCRIPTION)
    .option("-r, --reset", lang.RESET_CONNECTIN)
    .action(async (options) => {
        if (options.reset) {
            const reset = require("../src/commands/reset");
            await reset();
        }

        const connect = require("../src/commands/connect");
        await connect();
    });

const commandList = [
    {
        name: "init",
        description: lang.INIT_DESCRIPTION,
        handler: require("../src/commands/init").action,
    },
    {
        name: "ping",
        description: lang.TEST_CONNECTION,
        handler: require("../src/commands/monitor/ping"),
    },
    {
        name: "check",
        description: lang.CHECK_DESCRIPTION,
        handler: require("../src/commands/monitor/check"),
    },
    {
        name: "uptime",
        description: lang.UPTIME_DESCRIPTION,
        handler: require("../src/commands/monitor/uptime"),
    },
    {
        name: "disk",
        description: lang.DISK_DESCRIPTION,
        handler: require("../src/commands/monitor/disk"),
    },
    {
        name: "reboot",
        description: lang.REBOOT_DESCRIPTION,
        handler: require("../src/commands/manage/reboot"),
    },
    // { name: "backup", description: "Создание резервной копии проекта", handler: require("../src/commands/manage/backup") },
    {
        name: "mem",
        description: lang.MEM_DESCRIPTION,
        handler: require("../src/commands/monitor/mem"),
    },
];

commandList.forEach(({ name, description, handler }) => {
    program
        .command(name)
        .description(description)
        .action(async (...args) => {
            const wrapped = await withConnectionCheck(handler);
            return wrapped(...args);
        });
});

const deployCommand = new Command("deploy")
    .description(lang.DEPLOY_DESCRIPTION)
    .action(require("../src/commands/deploy/deploy"));

[
    {
        name: "start",
        description: lang.START_DESCRIPTION,
        handler: require("../src/commands/deploy/start"),
    },
    {
        name: "stop",
        description: lang.STOP_DESCRIPTION,
        handler: require("../src/commands/deploy/stop"),
    },
    {
        name: "reload",
        description: lang.RELOAD_DESCRIPTION,
        handler: require("../src/commands/deploy/reload"),
    },
].forEach(({ name, description, handler }) => {
    deployCommand
        .command(name)
        .description(description)
        .action(async (...args) => {
            const wrapped = await withConnectionCheck(handler);
            return wrapped(...args);
        });
});

program.addCommand(deployCommand);

function customHelp() {
    log.section("Usage:");
    console.log(chalk.green.bold("Usage:") + " space [options] [command]\n");

    log.section("Options:");
    console.log(
        chalk.green("  -h, --help     ") + " display help for command\n",
        chalk.green(" -l, --lang     ") + " switch language"
    );

    log.section("Commands:");
    program.commands.forEach((cmd) => {
        console.log(
            chalk.green(`  ${cmd.name()}         ${cmd.description()}`)
        );
    });

    console.log();
}

if (process.argv.length < 3) {
    customHelp();
} else {
    program.parse(process.argv);
}
