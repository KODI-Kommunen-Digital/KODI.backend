const AppError = require("../utils/appError");
const cityServiceRepository = require("../repository/citiesRepo");

const getCities = async function (hasForum) {
    try {
        const filters = []
        if (hasForum) 
        {
            filters.push(
                {
                    key: 'hasForum',
                    sign: '=',
                    value: hasForum
                })
        }
        // return await cityService.getCities(filter);
        const cities = await cityServiceRepository.getAll({
            filters
        });
        return cities.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getCities,
};
