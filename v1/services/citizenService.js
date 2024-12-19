// const citizenServiceRepo = require("../repository/citizenServices");
const AppError = require("../utils/appError");
// const cityRepo = require("../repository/cities");
const cityRepository = require("../repository/citiesRepo");
const citizenServiceRepository = require("../repository/citizenServicesRepo");
// const citizenServicesDataRepoRepository = require("../repository/CitizenServicesDataRepo");

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
        filters.cityId = cityData.id;
        filters.push({
            key: 'cityId',
            sign: '=',
            value: cityData.id
        })
    }
    // try {
    //     // return await citizenServiceRepo.getCitizenServiceTitles(filters);
    //     // const citizenServicesData = await citizenServicesDataRepoRepository.getAll({
    //     //     filters
    //     // });
    //     // return citizenServicesData.rows;
    //     return [];
    // } catch (err) {
    //     if (err instanceof AppError) throw err;
    //     throw new AppError(err);
    // }
    return [];
};

module.exports = {
    getCitizenServices,
    getCitizenServiceDataByCityId,
};
