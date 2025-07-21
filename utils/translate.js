const path = require('path');
const fs = require('fs')

const localesDir = path.join(process.cwd(), 'locales');
const translations = {};

// Preload all locale files at startup
fs.readdirSync(localesDir).forEach(file => {
    const lang = path.basename(file, '.json');
    const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
    translations[lang] = content;
});

function interpolate(message, variables = {}) {
    return message.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return key in variables ? variables[key] : `{{${key}}}`;
    });
}

function getTranslation(lang, key, variables = {}) {
    const messages = translations[lang] || translations.de; // fallback
    const raw = messages[key] || translations.de[key] || key;
    return interpolate(raw, variables);
}
module.exports = { getTranslation };
