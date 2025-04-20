const { loadConfig } = require("../services/config");
const { getPassword } = require("../services/keyring");

module.exports = async function isConnected() {
    const config = await loadConfig();
    if (!config || !config.username) return false;

    const password = await getPassword(config.username);
    return !!password;
};
