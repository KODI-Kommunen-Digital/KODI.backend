const { getAllCitizenServices } = require("../services/citizenServices");
const AppError = require("../utils/appError");

const getCitizenServices = async function (req, res, next) {
    try {
        const data = await getAllCitizenServices();
        res.status(200).json({
            status: "success",
            data,
        });    
    } catch (err) {
        return next(new AppError(err));
    }
}

module.exports = {
    getCitizenServices,
}