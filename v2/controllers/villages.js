const villageService = require("../services/villages");

const getVillages = async function (req, res, next) {
    const cityId = req.cityId;

    try {
        const villages = await villageService.getVillages(cityId);
        res.status(200).json({
            status: "success",
            data: villages,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getVillages,
};
