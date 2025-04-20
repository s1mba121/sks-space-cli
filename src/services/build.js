const { exec } = require("child_process");
const chalk = require("chalk");
const { getLangObject } = require("./lang");

const lang = getLangObject();

async function buildProject(command) {
    return new Promise((resolve, reject) => {
        const steps = [10, 25, 50, 75, 100];
        let step = 0;

        process.stdout.write(
            `${chalk.yellow("[~]")} ${lang.BUILD_PROJECT}: ${command} `
        );

        const interval = setInterval(() => {
            const percent = steps[step];
            const bar =
                "▓".repeat(step + 1) + "░".repeat(steps.length - step - 1);
            process.stdout.write(
                `\r${chalk.yellow("[~]")} ${lang.BUILD_PROJECT}: ${command} [${bar}] ${percent}%`
            );
            step++;

            if (step >= steps.length) clearInterval(interval);
        }, 300);

        exec(command, { stdio: "ignore" }, (err) => {
            clearInterval(interval);
            if (err) {
                console.log(`\n${chalk.red("✗")} ${lang.BUILD_ERROR}`);
                reject(err);
            } else {
                process.stdout.write(
                    `\r${chalk.green("✔")}  ${lang.BUILD_SUCCESS}: ${command} [▓▓▓▓▓▓▓▓▓▓] 100%\n`
                );
                resolve();
            }
        });
    });
}

module.exports = {
    buildProject,
};
