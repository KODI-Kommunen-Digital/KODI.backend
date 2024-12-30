const roles = require("../constants/roles");
const cityListingService = require("../services/cityListings");

const createCityListing = async function (req, res, next) {
    const payload = req.body;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;
    const hasDefaultImage =
    (payload.logo !== undefined && payload.logo !== null) ||
    payload.hasAttachment
        ? false
        : true;

    try {
        const listing = await cityListingService.createCityListing(
            payload,
            cityId,
            userId,
            roleId,
            hasDefaultImage,
        );
        res.status(200).json({
            status: "success",
            id: listing,
        });
    } catch (err) {
        return next(err);
    }
};

const getCityListingWithId = async function (req, res, next) {
    try {
        const id = req.params.id;
        const cityId = req.cityId;
        const repeatedRequest = req.repeatedRequest;

        const data = await cityListingService.getCityListingWithId(
            id,
            cityId,
            repeatedRequest,
        );
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const getAllCityListings = async function (req, res, next) {
    const params = req.query;
    const cityId = req.cityId;
    const isAdmin = req.roleId === roles.Admin
    try {
        const listings = await cityListingService.getAllCityListings(
            params,
            cityId,
            isAdmin
        );
        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        return next(err);
    }
};

const updateCityListing = async function (req, res, next) {
    const id = +req.params.id;
    const cityId = req.cityId;
    const payload = req.body;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await cityListingService.updateCityListing(
            id,
            cityId,
            payload,
            userId,
            roleId,
        );
        res.status(200).json({
            status: "success",
            id,
        });
    } catch (err) {
        return next(err);
    }
};



module.exports = {
    createCityListing,
    getCityListingWithId,
    getAllCityListings,
    updateCityListing,
};
