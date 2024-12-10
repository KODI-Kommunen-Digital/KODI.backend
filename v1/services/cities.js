const AppError = require("../utils/appError");
const cityService = require("../repository/cities");

const getCities = async function (filter) {
    try {
        return await cityService.getCities(filter);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getCities,
};
