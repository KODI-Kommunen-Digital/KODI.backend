const moreInfoTranslations = require("../constants/moreInfoTranslations");
// const { getMoreInfoService } = require("../repository/moreInfo");
const moreInfoRepo = require("../repository/moreInfo");
const AppError = require("../utils/appError");

const getMoreInfo = async function (req, res, next) {
    let language = "de";
    if (req.query.language === "en") {
        language = "en";
    }
    try {
        const data = await moreInfoRepo.getMoreInfoService();
        data.forEach(d => {
            d.title = moreInfoTranslations[language][d.title];
            d.isPdf = d.isPdf === 1;
        })
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(new AppError(err));
    }
};

module.exports = {
    getMoreInfo,
};