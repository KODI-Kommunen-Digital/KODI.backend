const AppError = require("../utils/appError");
const cityServiceRepository = require("../repository/citiesRepo");

const getCities = async function (hasForum) {
    try {
        // return await cityService.getCities(filter);
        const cities = await cityServiceRepository.getAll({
            filters: [
                {
                    key: 'hasForum',
                    sign: '=',
                    value: hasForum
                }
            ]
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
