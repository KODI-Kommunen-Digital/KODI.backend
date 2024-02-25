const citizenService = require("../services/citizenService");

const getCitizenServices = async function (req, res, next) {
    try {
        const data = await citizenService.getCitizenServices();
        res.status(200).json({
            status: "success",
            data,
        });    
    } catch (err) {
        return next(err);
    }
}

const getDigitalManagementServices = async function (req, res, next) {
    const cityId = req.query.cityId || null;
    try {
        const data = await citizenService.getDigitalManagementServices(cityId);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getCitizenServices,
    getDigitalManagementServices,
}