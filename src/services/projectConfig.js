const fs = require("fs-extra");
const path = require("path");

const getConfigPath = (env = "dev") =>
  path.join(process.cwd(), `.space.${env}.json`);

exports.getConfigPath = getConfigPath;

exports.loadProjectConfig = async (env = "dev") => {
  const configPath = getConfigPath(env);
  if (!(await fs.pathExists(configPath))) return null;
  return fs.readJson(configPath);
};

exports.saveProjectConfig = async (config, env = "dev") => {
  const configPath = getConfigPath(env);
  await fs.writeJson(configPath, config, { spaces: 2 });
};

exports.configExists = async (env = "dev") => {
  const configPath = getConfigPath(env);
  return fs.pathExists(configPath);
};
