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
};

const getCitizenServiceData = async function (req, res, next) {
    const cityId = req.query.cityId || null;
    let citizenServiceId;
    if (req.query.citizenServiceId) {
        citizenServiceId = req.query.citizenServiceId;
    }
    try {
        const data = await citizenService.getCitizenServiceDataByCityId(
            cityId,
            citizenServiceId,
        );
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getCitizenServices,
    getCitizenServiceData,
};
