// src/commands/reset.js

const { loadConfig, deleteConfig } = require("../services/config");
const { deletePassword } = require("../services/keyring");

module.exports = async () => {
  const config = await loadConfig();
  if (config && config.username) {
    await deletePassword(config.username);
  }
  await deleteConfig();
  console.log("[*] Конфигурация и пароль сброшены.");
  process.exit(0);
};
