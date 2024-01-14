const moreInfoTranslations = require("../constants/moreInfoTranslations");
const moreInfoRepo = require("../repository/moreInfo");
const AppError = require("../utils/appError");

const getMoreInfo = async function (queryLanguage) {
    let language = "de";
    if (queryLanguage === "en") {
        language = "en";
    }
    try {
        const data = await moreInfoRepo.getMoreInfoService();
        data.forEach(d => {
            d.title = moreInfoTranslations[language][d.title];
            d.isPdf = d.isPdf === 1;
        })
        return data;

    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getMoreInfo,
};