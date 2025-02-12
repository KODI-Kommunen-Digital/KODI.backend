const AppError = require("../utils/appError");
const cityRepository = require("../repository/citiesRepo");
const villageRepository = require("../repository/villageRepo");

const getVillages = async function (cityId) {
    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }
    try {
        const response = await cityRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: cityId,
                },
            ]
        });
        if (!response) {
            throw new AppError(`Invalid City '${cityId}' given`, 400);
        }
        // return await villageRepo.getVillageForCity(cityId);
        const villages = await villageRepository.getAll({
            filters: [
                {
                    key: "cityId",
                    sign: "=",
                    value: cityId,
                },
            ]
        });
        return villages?.rows ?? [];
    } catch (err) {
        throw new AppError(err);
    }
};

module.exports = {
    getVillages,
};
