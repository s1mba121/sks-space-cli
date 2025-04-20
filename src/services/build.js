const { exec } = require("child_process");
const chalk = require("chalk");

async function buildProject(command) {
    return new Promise((resolve, reject) => {
        const steps = [10, 25, 50, 75, 100];
        let step = 0;

        process.stdout.write(`${chalk.yellow("[~]")} Сборка проекта: ${command} `);

        const interval = setInterval(() => {
            const percent = steps[step];
            const bar = "▓".repeat(step + 1) + "░".repeat(steps.length - step - 1);
            process.stdout.write(`\r${chalk.yellow("[~]")} Сборка проекта: ${command} [${bar}] ${percent}%`);
            step++;

            if (step >= steps.length) clearInterval(interval);
        }, 300);

        exec(command, { stdio: "ignore" }, (err) => {
            clearInterval(interval);
            if (err) {
                console.log(`\n${chalk.red("✗")} Сборка завершилась с ошибкой`);
                reject(err);
            } else {
                process.stdout.write(`\r${chalk.green("✔")}  Сборка завершена: ${command} [▓▓▓▓▓▓▓▓▓▓] 100%\n`);
                resolve();
            }
        });
    });
}

module.exports = {
    buildProject
};
