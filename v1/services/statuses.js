const AppError = require("../utils/appError");
const statusRepository = require("../repository/statusRepo");

const getAllStatuses = async function () {
    try {
        const statuses = await statusRepository.getAll();
        return statuses?.rows ?? [];
    } catch (error) {
        throw new AppError(error);
    }
};

module.exports = {
    getAllStatuses,
};
