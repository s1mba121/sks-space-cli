import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import glob from "glob";

export async function spaceIcon() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const srcIconPath = path.join(__dirname, "../../public/sks-space.svg");

    const extGlob = path.join(
        os.homedir(),
        ".vscode/extensions/pkief.material-icon-theme-*"
    );
    const matches = glob.sync(extGlob);
    if (!matches.length) {
        console.error("❌ Не найдено расширение Material Icon Theme");
        return;
    }
    const materialPath = matches.sort().pop();
    const iconsDir = path.join(materialPath, "icons");

    if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

    const destIconPath = path.join(iconsDir, "sks-space.svg");

    fs.copyFileSync(srcIconPath, destIconPath);

    const vscodeSettingsPath = path.join(
        os.homedir(),
        "Library/Application Support/Code/User/settings.json"
    ); // Mac, для Windows/Linux надо поправить путь
    let settings = {};
    if (fs.existsSync(vscodeSettingsPath)) {
        try {
            settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, "utf-8"));
        } catch {}
    }

    const distJsonPath = path.join(materialPath, "dist", "material-icons.json");
    if (fs.existsSync(distJsonPath)) {
        let distData = {};
        try {
            distData = JSON.parse(fs.readFileSync(distJsonPath, "utf-8"));
        } catch (e) {
            console.error("Ошибка чтения material-icons.json:", e);
        }

        distData.fileNames = distData.fileNames || {};
        if (!distData.fileNames[".space.json"]) {
            distData.fileNames[".space.json"] = "sks-space";
            console.log("➕ Добавлена привязка .space.json → sks-space");
        }

        fs.writeFileSync(distJsonPath, JSON.stringify(distData, null, 2));
    }

    settings["workbench.iconTheme"] = "Material Icon Theme";
    settings["material-icon-theme.files.associations"] =
        settings["material-icon-theme.files.associations"] || {};
    settings["material-icon-theme.files.associations"]["*.space.json"] =
        "../../icons/sks-space";

    fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2));

    console.log("✅ Иконка для .space.json добавлена в Material Icon Theme!");
}
