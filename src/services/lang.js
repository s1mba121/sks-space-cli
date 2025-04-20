const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_PATH = path.join(os.homedir(), ".space_lang");

function saveLang(lang) {
    fs.writeFileSync(CONFIG_PATH, lang);
}

function loadLang() {
    if (fs.existsSync(CONFIG_PATH)) {
        return fs.readFileSync(CONFIG_PATH, "utf-8");
    }
    return "ru";
}

function getLangObject() {
    const lang = loadLang();
    return require(`../../lang/${lang}.js`);
}

module.exports = {
    saveLang,
    loadLang,
    getLangObject,
};
