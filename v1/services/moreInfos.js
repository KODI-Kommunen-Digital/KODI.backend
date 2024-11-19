const moreInfoTranslations = require("../constants/moreInfoTranslations");
// const moreInfoRepo = require("../repository/moreInfo");
const moreInfoRepository = require("../repository/moreInfoRepo");
const AppError = require("../utils/appError");

const getMoreInfo = async function (queryLanguage) {
    let language = "de";
    if (queryLanguage === "en") {
        language = "en";
    }
    try {
        // const data = await moreInfoRepo.getMoreInfoService();
        const dataResp = await moreInfoRepository.getAll();
        const data = dataResp.rows;
        data.forEach((d) => {
            d.title = moreInfoTranslations[language][d.title];
            d.isPdf = d.isPdf === 1;
        });
        return data;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getMoreInfo,
};
