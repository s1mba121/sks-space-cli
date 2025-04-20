// src/utils/prompt.js

const { default: inquirer } = require("inquirer");

exports.askCredentials = () =>
  inquirer.prompt([
    { type: "input", name: "ip", message: "IP сервера:" },
    { type: "input", name: "username", message: "Пользователь:" },
    { type: "password", name: "password", message: "Пароль:", mask: "*" }
  ]);
