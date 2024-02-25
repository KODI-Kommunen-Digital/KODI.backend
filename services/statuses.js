const statusRepo = require("../repository/status");
const AppError = require("../utils/appError");

const getAllStatuses = async function () {
    try {
        return await statusRepo.getStatuses();
    } catch (error) {
        throw new AppError(error);
    }
}

module.exports = {
    getAllStatuses,
};