
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

const getAdLists = async function (req, res, next) {
    try {
        /*
        Query Params:
        - cityId: number 
        - skipAdIds: string (comma separated adIds)
        - count: number (default 5)
        - sort: string (default lastShown)
        - sortDesc: boolean (default false)
        */
        const skipAdIdsStr = req.query.skipAdIds;
        const returnAdsCount = req.query.count ? Number(req.query.count) : 5;
        const sort = req.query.sort ? req.query.sort : "lastShown";
        const sortDesc = req.query.sortDesc === "true" ? true : false;
        let cityId = req.query.cityId ? Number(req.query.cityId) : null;

        const queryParams = [];
        const countQueryParams = [];
        if (!cityId || isNaN(cityId)) {
            cityId = null;
        } else {
            queryParams.push(cityId);
            countQueryParams.push(cityId);
        }

        let skipAdIds = skipAdIdsStr ? skipAdIdsStr.split(",").map(Number) : [];
        skipAdIds = skipAdIds.filter((id) => !isNaN(id));

        const data = await adsSevice.getAdLists(cityId, skipAdIds, returnAdsCount, sort, sortDesc);
        res.status(200).json({
            status: "success",
            data: data.ads,
            totalCount: data.totalCount,
        });
    } catch (error) {
        console.error(error);
        return next(new AppError(error));
    }
};

module.exports = {
    getRandomAds,
    getAdLists,
}