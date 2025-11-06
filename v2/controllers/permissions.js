const permissionsService = require("../services/permissions");

const getAllPermissions = async function (req, res, next) {
    try {
        const data = await permissionsService.getAllPermissions();
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAllPermissions,
};


