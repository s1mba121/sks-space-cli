# sks-space-cli — A CLI Tool for Easy VPS Management

**space-cli** is a user-friendly CLI tool that lets you connect to your VPS, set up the environment, and deploy projects (SPA, Node.js, static files) in just a minute — all with a single command.

🧠 Under the hood: automatic SSH management, deployment via `rsync`, server cleanup, and monitoring — everything to help you focus on development.

---

## ⚙️ Installation

```bash
npm install -g space-cli
```

---

## 🛠 Quick Start

```bash
space connect   # Connect to the server and add your SSH key
space init      # Initialize project configuration
space deploy    # Deploy your project to the server
space cleanup   # Clean up junk and logs on the server
```

> ❗ `space connect` is required before using other commands — connecting to the server is mandatory.

---

## 📦 Main Commands

| Command         | Description                                            |
| --------------- | ------------------------------------------------------ |
| `connect`       | Connect to the server, add SSH key, configure settings |
| `init`          | Initialize project — create `.space.dev.json` file     |
| `deploy`        | Deploy the project via `rsync`                         |
| `deploy start`  | Start the server-side application                      |
| `deploy stop`   | Stop the server-side application                       |
| `deploy reload` | Restart the server-side application                    |
| `cleanup`       | Clean up logs, cache, and temporary files              |
| `check`         | Run general server diagnostics                         |
| `mem`           | Display memory usage                                   |
| `disk`          | Display disk space usage                               |
| `uptime`        | Show server uptime                                     |
| `reboot`        | Reboot the server                                      |

---

## 🧠 Usage Examples

### First Connection & Setup

```bash
space connect
space init
```

### Project Deployment

```bash
space deploy
```

### VPS Cleanup

```bash
space cleanup
```

---

## 🛠 Project Configuration

```jsonc
// .space.dev.json
{
    "project": {
        "name": "Project-Backend",
        "type": "node", // or "spa", "static"
        "buildCommand": null,
    },
    "server": {
        "ip": "123.456.78.90",
        "username": "root",
    },
    "deploy": {
        "localPath": ".",
        "remotePath": "/var/www/node/Project-Backend",
        "preDeploy": null,
        "postDeploy": null,
        "includeEnv": true,
    },
    "nginx": {
        "domain": "example.com",
        "subdomain": "dev",
        "port": 3000,
    },
    "ignored": [
        ".git",
        "node_modules",
        "package-lock.json",
        "yarn.lock",
        "npm-debug.log",
        "yarn-error.log",
        ".DS_Store",
        "uploads/",
    ],
}
```

---

## 🔐 Requirements

- Node.js >= 16
- SSH access to the server
- `rsync` and `pm2` must be available on the server (for Node.js projects)

---

## 📄 License

MIT License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/s1mba121/sks-space-cli/blob/main/LICENSE) file for details.
