const AppError = require("../utils/appError");
const villageRepository = require("../repository/villageRepo");

const getVillages = async function (cityId) {
    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }
    try {
        // return await villageRepo.getVillageForCity(cityId);
        const villages = await villageRepository.getAll({ cityId });
        return villages?.rows ?? [];
    } catch (err) {
        throw new AppError(err);
    }
};

module.exports = {
    getVillages,
};
