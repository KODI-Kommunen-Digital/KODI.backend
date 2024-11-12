const citizenServiceRepo = require("../repository/citizenServices");
const AppError = require("../utils/appError");
const cityRepo = require("../repository/cities");

const getCitizenServices = async function () {
    try {
        return await citizenServiceRepo.getAllCitizenServices();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getCitizenServiceDataByCityId = async function (
    cityId,
    citizenServiceId,
) {
    const filters = { citizenServiceId };
    if (cityId) {
        const cityData = await cityRepo.getCityWithId(cityId);
        if (!cityData) {
            throw new AppError(`Invalid City '${cityId}' given`, 400);
        }
        filters.cityId = cityData.id;
    }
    try {
        return await citizenServiceRepo.getCitizenServiceTitles(filters);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getCitizenServices,
    getCitizenServiceDataByCityId,
};
