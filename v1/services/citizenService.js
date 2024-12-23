const AppError = require("../utils/appError");
const cityRepository = require("../repository/citiesRepo");
const citizenServiceRepository = require("../repository/citizenServicesRepo");
const citizenServicesDataRepoRepository = require("../repository/CitizenServicesDataRepo");

const getCitizenServices = async function () {
    try {
        // return await citizenServiceRepo.getAllCitizenServices();
        const citizenServices = await citizenServiceRepository.getAll();
        return citizenServices.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getCitizenServiceDataByCityId = async function (
    cityId,
    citizenServiceId,
) {
    const filters = []
    if (citizenServiceId) {
        filters.push({
            key: 'citizenServiceId',
            sign: '=',
            value: citizenServiceId
        })
    }
    if (cityId) {
        const cityData = await cityRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: cityId,
                },
            ]
        });
        if (!cityData) {
            throw new AppError(`Invalid City '${cityId}' given`, 400);
        }
        filters.push({
            key: 'cityId',
            sign: '=',
            value: cityData.id
        })
    }
    try {
        const citizenServicesData = await citizenServicesDataRepoRepository.getAll({
            filters
        });
        return citizenServicesData.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getCitizenServices,
    getCitizenServiceDataByCityId,
};
