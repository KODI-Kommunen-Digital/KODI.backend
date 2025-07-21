const { getTranslation } = require("../../utils/translate");


function translationMiddleware(req, res, next) {
    const lang = (
        req.query.lang ||
        req.headers['x-lang'] ||
        req.headers['accept-language']?.split(',')[0]
    )?.toLowerCase() || 'de';

    req.lang = lang;

    // Inject translation function
    req.t = (key, variables) => getTranslation(lang, key, variables);

    next();
}
module.exports = { translationMiddleware };
