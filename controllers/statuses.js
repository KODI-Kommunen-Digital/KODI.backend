const statusService = require("../services/statuses");

const getAllStatuses = async function (req, res, next) {
    try {
        const data = await statusService.getAllStatuses();
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getAllStatuses,
};