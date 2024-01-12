const villageRepo = require("../repository/village");
const AppError = require("../utils/appError");

const getVillages = async function (req, res, next) {
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }

    try {
        const villages = await villageRepo.getVillageForCity(cityId);
        res.status(200).json({
            status: "success",
            data: villages,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

module.exports = {
    getVillages,
}