const { Client } = require("ssh2");
const path = require("path");
const { loadConfig } = require("../../services/config");
const { loadProjectConfig } = require("../../services/projectConfig");
const { getPassword } = require("../../services/keyring");
const scp = require("scp2");

module.exports = async () => {
  const config = await loadConfig();
  const project = await loadProjectConfig();

  if (!config || !project || !config.ip || !config.username) {
    console.log("[!] Не найдена конфигурация проекта или сервера.");
    return;
  }

  const { ip, username } = config;
  const password = await getPassword(username);
  if (!password) {
    console.log("[!] Пароль не найден.");
    return;
  }

  const remotePath = project.deploy.remotePath.replace(/^~\/?/, `/home/${username}/`);
  const archiveName = `${project.name || "project"}-backup.tar.gz`;
  const remoteBackupPath = `/home/${username}/backups/${archiveName}`;
  const localBackupPath = path.join(process.cwd(), archiveName);

  const conn = new Client();
  conn.on("ready", () => {
    console.log("[*] Создаём архив на сервере...");

    const cmds = [
      `mkdir -p ~/backups`,
      `tar -czf ${remoteBackupPath} -C ${remotePath} .`
    ];

    let i = 0;
    const next = () => {
      if (i >= cmds.length) {
        conn.end();
        console.log("[*] Загружаем бекап на локальный компьютер...");
        scp.scp({
          host: ip,
          username,
          password,
          path: remoteBackupPath
        }, localBackupPath, err => {
          if (err) console.log("[!] Ошибка при скачивании:", err.message);
          else console.log(`[+] Бекап сохранён как ${localBackupPath}`);
        });
        return;
      }

      const cmd = cmds[i++];
      conn.exec(cmd, (err, stream) => {
        if (err) return next();
        stream.on("close", next);
      });
    };

    next();
  });

  conn.on("error", err => console.log("[!] SSH ошибка:", err.message));
  conn.connect({ host: ip, username, password });
};
