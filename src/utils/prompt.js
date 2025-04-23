exports.askCredentials = async () => {
    const inquirer = await import("inquirer").then((mod) => mod.default);

    return inquirer.prompt([
        { type: "input", name: "ip", message: "IP сервера:" },
        { type: "input", name: "username", message: "Пользователь:" },
        { type: "password", name: "password", message: "Пароль:", mask: "*" },
    ]);
};
