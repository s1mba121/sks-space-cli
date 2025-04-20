#!/usr/bin/env node
const { program, Command } = require("commander");
const chalk = require("chalk");

const log = {
  info: (msg) => console.log(`${chalk.cyan("i")}  ${msg}`),
  success: (msg) => console.log(`${chalk.green("✔")}  ${msg}`),
  warn: (msg) => console.log(`${chalk.yellow("~")}  ${msg}`),
  error: (msg) => console.log(`${chalk.red("✗")}  ${msg}`),
  section: (msg) => console.log(chalk.whiteBright(`\n=== ${msg} === \n`)),
};

program
  .command("connect")
  .description("Подключиться к серверу")
  .option("-r, --reset", "Сбросить конфигурацию перед подключением")
  .action(async (options) => {
    if (options.reset) {
      const reset = require("../src/commands/reset");
      await reset();
    }

    const connect = require("../src/commands/connect");
    await connect();
  });

const commandList = [
  { name: "init", description: "Инициализировать проект с конфигурацией деплоя", handler: require("../src/commands/init").action },
  { name: "ping", description: "Проверка доступности сервера", handler: require("../src/commands/monitor/ping") },
  { name: "check", description: "Проверка состояния сервисов на сервере", handler: require("../src/commands/monitor/check") },
  { name: "uptime", description: "Получить время работы сервера", handler: require("../src/commands/monitor/uptime") },
  { name: "disk", description: "Проверка использования диска на сервере", handler: require("../src/commands/monitor/disk") },
  { name: "reboot", description: "Перезагрузка сервера", handler: require("../src/commands/manage/reboot") },
  { name: "cleanup", description: "Очистка временных файлов на сервере", handler: require("../src/commands/manage/cleanup") },
  // { name: "backup", description: "Создание резервной копии проекта", handler: require("../src/commands/manage/backup") },
  { name: "update", description: "Обновление проекта", handler: require("../src/commands/manage/update") },
  { name: "mem", description: "Проверка использования памяти на сервере", handler: require("../src/commands/monitor/mem") },
];

commandList.forEach(({ name, description, handler }) => {
  program.command(name).description(description).action(handler);
});

const deployCommand = new Command("deploy")
  .description("Управление деплоем приложения")
  .action(require("../src/commands/deploy/deploy"));

[
  { name: "start", description: "Запуск приложения на сервере", handler: require("../src/commands/deploy/start") },
  { name: "stop", description: "Остановка приложения на сервере", handler: require("../src/commands/deploy/stop") },
  { name: "reload", description: "Перезапуск приложения на сервере", handler: require("../src/commands/deploy/reload") },
].forEach(({ name, description, handler }) => {
  deployCommand.command(name).description(description).action(handler);
});

program.addCommand(deployCommand);

function customHelp() {
  log.section("Usage:");
  console.log(chalk.green.bold("Usage:") + " space [options] [command]\n");

  log.section("Options:");
  console.log(chalk.green("  -h, --help     ") + " display help for command\n");

  log.section("Commands:");
  program.commands.forEach((cmd) => {
    console.log(chalk.green(`  ${cmd.name()}         ${cmd.description()}`));
  });

  console.log();
}

if (process.argv.length < 3) {
  customHelp();
} else {
  program.parse(process.argv);
}
