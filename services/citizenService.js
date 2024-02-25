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
}

const getDigitalManagementServices = async function (cityId) {
    try {
        if (cityId) {
            if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
                throw new AppError(`City is not present`, 404);
            } else {
                try {
                    const response = await cityRepo.getCityWithId(cityId);
                    if (!response) {
                        throw new AppError(`Invalid City '${cityId}' given`, 400);
                    }
                } catch (err) {
                    if (err instanceof AppError) throw err;
                    throw new AppError(err);
                }
            }
            return await citizenServiceRepo.getDigitalManagement(cityId);
        } else {
            return await citizenServiceRepo.getDigitalManagement();
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

module.exports = {
    getCitizenServices,
    getDigitalManagementServices,
}