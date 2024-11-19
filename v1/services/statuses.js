const AppError = require("../utils/appError");
const statusRepository = require("../repository/statusRepo");

const getAllStatuses = async function () {
    try {
        return await statusRepository.getAll();
    } catch (error) {
        throw new AppError(error);
    }
};

module.exports = {
    getAllStatuses,
};
