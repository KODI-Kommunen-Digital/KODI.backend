const { getStatuses } = require("../services/statusService");
const AppError = require("../utils/appError");

const getAllStatuses = async function (req, res, next) {
    try {
        const data = await getStatuses();
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (error) {
        return next(new AppError(error));
    }
}

module.exports = {
    getAllStatuses,
};