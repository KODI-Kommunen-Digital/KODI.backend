const crypto = require('crypto');
const deepl = require('deepl-node');
const { getAsync, setAsync } = require('./redisUtil');

/**
 * Generate a stable cache key for a text value.
 * @param {string} text
 * @returns {string}
 */
function hashText(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Try to read a translation from Redis.
 * @param {string} text - Source text to translate.
 * @param {string} targetLang - Target language code.
 * @returns {Promise<string|null>} Cached value or null.
 */
async function getCachedTranslation(text, targetLang) {
    const cacheKey = `translation:${targetLang}:${hashText(text)}`;
    return await getAsync(cacheKey);
}

/**
 * Persist a translation in Redis for 30 days.
 * @param {string} text - Source text.
 * @param {string} targetLang - Target language code.
 * @param {string} translatedText - Translated text to cache.
 */
async function cacheTranslation(text, targetLang, translatedText) {
    const cacheKey = `translation:${targetLang}:${hashText(text)}`;
    // 30 days TTL (in seconds)
    await setAsync(cacheKey, translatedText, 30 * 24 * 60 * 60);
}

/**
 * Translate an array of texts using DeepL with Redis caching.
 * @param {string[]} texts - List of texts to translate.
 * @param {string} targetLang - Target language code (e.g. 'DE').
 * @returns {Promise<Array<{text: string, cached: boolean}>>}
 */
async function translateWithCache(texts, targetLang) {
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);
    const translations = [];

    for (const text of texts) {
        // First attempt to fetch from cache.
        const cached = await getCachedTranslation(text, targetLang);
        if (cached) {
            translations.push({ text: cached, cached: true });
            continue;
        }

        // Cache miss – call DeepL.
        const result = await translator.translateText(text, null, targetLang);
        translations.push({ text: result.text, cached: false });
        await cacheTranslation(text, targetLang, result.text);
    }

    return translations;
}

module.exports = {
    translateWithCache,
    hashText,
    getCachedTranslation,
    cacheTranslation,
};
