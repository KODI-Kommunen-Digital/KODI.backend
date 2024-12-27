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

const uploadImageForCityListing = async function (req, res, next) {
    const listingId = req.params.id;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;
    const uploadedImages = req.body.image;
    const { image } = req.files;
    try {
        await cityListingService.uploadImageForCityListing(
            listingId,
            cityId,
            userId,
            roleId,
            image,
            uploadedImages
        );
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const vote = async function (req, res, next) {
    const cityId = req.cityId;
    const listingId = req.params.id;
    const optionId = req.body.optionId;
    const vote = req.body.vote;

    try {
        const voteCount = await cityListingService.vote(
            listingId,
            cityId,
            optionId,
            vote,
        );
        return res.status(200).json({
            status: "success",
            votes: voteCount,
        });
    } catch (err) {
        return next(err);
    }
};

const uploadPDFForCityListing = async function (req, res, next) {
    const listingId = req.params.id;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;
    const { pdf } = req.files;

    try {
        await cityListingService.uploadPDFForCityListing(
            listingId,
            cityId,
            userId,
            roleId,
            pdf,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deleteImageForCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await cityListingService.deleteImageForCityListing(
            id,
            cityId,
            userId,
            roleId,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deletePDFForCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await cityListingService.deletePDFForCityListing(
            id,
            cityId,
            userId,
            roleId,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deleteCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;
    try {
        await cityListingService.deleteCityListing(id, cityId, userId, roleId);
        return res.status(200).json({
            status: "success",
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
    uploadImageForCityListing,
    uploadPDFForCityListing,
    deleteImageForCityListing,
    deletePDFForCityListing,
    deleteCityListing,
    vote,
};
