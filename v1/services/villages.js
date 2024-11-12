const villageRepo = require("../repository/village");
const AppError = require("../utils/appError");

const getVillages = async function (cityId) {
    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }
    try {
        return await villageRepo.getVillageForCity(cityId);
    } catch (err) {
        throw new AppError(err);
    }
};

module.exports = {
    getVillages,
};
