/**
 * Utility functions for protecting sensitive words during translation
 */

// Words that should be protected from translation (brand roots only)
const PROTECTED_WORDS = [
    'Zeigmal',
    'Lauschtour',
    'Village',
    'Naldo',
    'Parkster',
    "App"
];

/**
 * Masks protected words in text with placeholders
 * @param {string} text - The text to mask
 * @returns {Object} - Object containing masked text and mapping of placeholders to original words
 */
const maskProtectedWords = (text) => {
    if (!text || typeof text !== 'string') {
        return { maskedText: text, wordMap: {} };
    }

    let maskedText = text;
    const wordMap = {};
    let placeholderIndex = 1;

    PROTECTED_WORDS.forEach(word => {
        // Create case-insensitive regex to match the word
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

        // Replace all occurrences of the word with placeholder
        maskedText = maskedText.replace(regex, (match) => {
            // Use a translation-safe placeholder that contains no dictionary words or underscores
            const placeholder = `__brand${placeholderIndex}__`;
            wordMap[placeholder] = match; // Preserve original case
            placeholderIndex++;
            return placeholder;
        });
    });

    return { maskedText, wordMap };
};

/**
 * Unmasks protected words in text by replacing placeholders with original words
 * @param {string} text - The text to unmask
 * @param {Object} wordMap - Mapping of placeholders to original words
 * @returns {string} - Text with placeholders replaced by original words
 */
const unmaskProtectedWords = (text, wordMap) => {
    if (!text || typeof text !== 'string' || !wordMap) {
        return text;
    }

    let unmaskedText = text;

    // Replace all placeholders with their original words
    Object.entries(wordMap).forEach(([placeholder, originalWord]) => {
        unmaskedText = unmaskedText.replace(new RegExp(placeholder, 'gi'), originalWord);
    });

    return unmaskedText;
};

/**
 * Processes an array of texts by masking protected words
 * @param {string[]} texts - Array of texts to mask
 * @returns {Object} - Object containing masked texts and combined word mapping
 */
const maskTexts = (texts) => {
    const maskedTexts = [];
    const combinedWordMap = {};
    let globalPlaceholderIndex = 1;

    texts.forEach(text => {
        if (!text || typeof text !== 'string') {
            maskedTexts.push(text);
            return;
        }

        let maskedText = text;
        const wordMap = {};

        PROTECTED_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

            maskedText = maskedText.replace(regex, (match) => {
                // Use the same translation-safe placeholder format here as well
                const placeholder = `KODIMASK${globalPlaceholderIndex}X`;
                wordMap[placeholder] = match;
                combinedWordMap[placeholder] = match;
                globalPlaceholderIndex++;
                return placeholder;
            });
        });

        maskedTexts.push(maskedText);
    });

    return { maskedTexts, wordMap: combinedWordMap };
};

/**
 * Processes an array of translated texts by unmasking protected words
 * @param {string[]} texts - Array of translated texts to unmask
 * @param {Object} wordMap - Mapping of placeholders to original words
 * @returns {string[]} - Array of texts with placeholders replaced by original words
 */
const unmaskTexts = (texts, wordMap) => {
    if (!texts || !Array.isArray(texts) || !wordMap) {
        return texts;
    }

    return texts.map(text => unmaskProtectedWords(text, wordMap));
};

module.exports = {
    maskProtectedWords,
    unmaskProtectedWords,
    maskTexts,
    unmaskTexts,
    PROTECTED_WORDS
};
