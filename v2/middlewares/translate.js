const { getTranslation } = require("../../utils/translate");
const supportedLanguages = require("../constants/supportedLanguages");


function translationMiddleware(req, res, next) {
    let lang = (
        req.query.lang ||
        req.headers['x-lang'] ||
        req.headers['accept-language']?.split(',')[0]
    )?.toLowerCase() || 'de';

    if (!supportedLanguages.includes(lang)) {
        lang = 'de';
    }
    req.lang = lang;
    // Inject translation function
    req.t = (key, variables) => getTranslation(lang, key, variables);

    next();
}
module.exports = { translationMiddleware };
