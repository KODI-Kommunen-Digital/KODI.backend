const AppError = require("../utils/appError");
const permissionsRepository = require("../repository/permissionsRepo");

const getAllPermissions = async function () {
    try {
        const permissions = await permissionsRepository.getAll();
        return permissions?.rows ?? [];
    } catch (error) {
        throw new AppError(error);
    }
};

module.exports = {
    getAllPermissions,
};


