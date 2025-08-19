const fs = require("fs-extra");
const path = require("path");

const getConfigPath = () => path.join(process.cwd(), `.space.json`);

exports.getConfigPath = getConfigPath;

exports.loadProjectConfig = async (env = "dev") => {
    const configPath = getConfigPath();
    if (!(await fs.pathExists(configPath))) return null;

    const allConfig = await fs.readJson(configPath);
    return allConfig[env] || null;
};

exports.saveProjectConfig = async (config) => {
    const configPath = getConfigPath();
    await fs.writeJson(configPath, config, { spaces: 2 });
};

exports.configExists = async () => {
    const configPath = getConfigPath();
    return fs.pathExists(configPath);
};
