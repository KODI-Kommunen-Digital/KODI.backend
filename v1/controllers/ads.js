
const adsSevice = require("../services/ads");
const AppError = require("../utils/appError");

const getRandomAds = async function (req, res, next) {
    try {
        const ad = await adsSevice.getRandomAds(req.query.cityId, req.query.listingId);
        if (!ad) {
            return res.status(200).json({
                status: "success",
            });
        }
        res.status(200).json({
            status: "success",
            data: ad,
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error));
    }
}

module.exports = {
    getRandomAds,
}