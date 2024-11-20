// const citizenServiceRepo = require("../repository/citizenServices");
const AppError = require("../utils/appError");
// const cityRepo = require("../repository/cities");
const cityRepository = require("../repository/citiesRepo");
const citizenServiceRepository = require("../repository/citizenServicesRepo");

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
    // const filters = { citizenServiceId };
    const filters = [
        {
            key: 'citizenServiceId',
            sign: '=',
            value: citizenServiceId
        }
    ]
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
        filters.cityId = cityData.id;
        filters.push({
            key: 'cityId',
            sign: '=',
            value: cityData.id
        })
    }
    try {
        // return await citizenServiceRepo.getCitizenServiceTitles(filters);
        const citizenServices = await citizenServiceRepository.getAll({
            filters
        });
        return citizenServices.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getCitizenServices,
    getCitizenServiceDataByCityId,
};
