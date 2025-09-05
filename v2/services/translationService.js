const supportedLanguages = require("../constants/supportedLanguages");
const { translateWithCache } = require("../utils/translationCacheUtil");


/**
 * Translates text values in an object to the target language
 * @param {Object} data - The data object containing text to translate
 * @param {string} targetLang - Target language code (e.g., 'DE' for German)
 * @param {string[]} [translationFields] - Array of field names that should be translated. If not provided, all string fields will be translated.
 * @returns {Promise<Object>} - Translated data object
 */
const translateObjectValues = async (data, targetLang = 'de', translationFields = []) => {
    if (!targetLang || !supportedLanguages.includes(targetLang)) {
        return data;
    }
    try {
        const textsToTranslate = [];
        const map = [];

        const collectStrings = (obj, translationFields = [], path = '') => {
            if (typeof obj === 'string') {
                const trimmed = obj.trim();
                if (trimmed) {
                    textsToTranslate.push(trimmed);
                    map.push({ path, isLeaf: true });
                }
            } else if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    collectStrings(item, translationFields, path ? `${path}[${index}]` : `[${index}]`);
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    const newPath = path ? `${path}.${key}` : key;
                    const isTranslationField = translationFields.includes(key);

                    if (typeof value === 'string') {
                        if (isTranslationField) {
                            const trimmed = value.trim();
                            if (trimmed) {
                                textsToTranslate.push(trimmed);
                                map.push({ path: newPath, isLeaf: true });
                            }
                        }
                    } else if (Array.isArray(value) || (value && typeof value === 'object')) {
                        collectStrings(value, translationFields, newPath);
                    }
                });
            }
        };
        collectStrings(data, translationFields);
        if (textsToTranslate.length === 0) {
            return data;
        }
        const results = await translateWithCache(textsToTranslate, targetLang);
        const setNestedValue = (obj, path, value) => {
            if (!path) return;
            if (Object.prototype.hasOwnProperty.call(obj, path)) {
                obj[path] = value;
                return;
            }
            const keys = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
            let current = obj;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (current[key] === undefined || current[key] === null) {
                    const nextKey = keys[i + 1];
                    const nextIsArrayIndex = /^\d+$/.test(nextKey);
                    current[key] = nextIsArrayIndex ? [] : {};
                }
                current = current[key];
            }

            const lastKey = keys[keys.length - 1];
            if (current !== undefined && current !== null) {
                current[lastKey] = value;
            }
        };
        results.forEach((translation, index) => {
            const { path } = map[index];
            if (path) {
                setNestedValue(data, path, translation.text);
            }
        });
        return data;
    } catch (error) {
        console.error('Translation error:', error);
        return data;
    }
};

module.exports = {
    translateObjectValues
};