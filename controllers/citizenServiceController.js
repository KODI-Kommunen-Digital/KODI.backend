const { getAllCitizenServices, getDigitalManagement } = require("../services/citizenServices");
const AppError = require("../utils/appError");
const cityService = require("../services/cities");

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

const getDigitalManagementServices = async function (req, res, next) {
    const cityId = req.query.cityId || null;
    // let promise = null;
    let data = [];
    try {
        if (cityId) {
            if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
                return next(new AppError(`City is not present`, 404));
            } else {
                try {
                    const response = await cityService.getCityWithId(cityId);
                    if (!response) {
                        return next(new AppError(`Invalid City '${cityId}' given`, 400));
                    }
                } catch (err) {
                    return next(new AppError(err));
                }
            }
            // promise = database.get(tables.DIGITAL_MANAGEMENT_TABLE, { cityId });
            data = await getDigitalManagement(cityId);
            
        } else {
            // promise = database.get(tables.DIGITAL_MANAGEMENT_TABLE);
            data = await getDigitalManagement();
        }
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(new AppError(err));
    }
    

    // promise
    //     .then((response) => {
    //         const data = response.rows;
    //         res.status(200).json({
    //             status: "success",
    //             data,
    //         });
    //     })
    //     .catch((err) => {
    //         return next(new AppError(err));
    //     });
}

module.exports = {
    getCitizenServices,
    getDigitalManagementServices,
}