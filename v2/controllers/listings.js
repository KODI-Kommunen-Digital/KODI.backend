const roles = require("../constants/roles");
const listingService = require("../services/listings");

const getAllListings = async (req, res, next) => {
    const params = req.query;
    const {
        pageNo = 1,
        pageSize = 9,
        sortByStartDate,
        statusId,
        subcategoryId,
        categoryId,
        cityId,
        translate,
        showExternalListings,
        specificDate
    } = params;
    const isAdmin = req.roleId === roles.Admin;
    try {
        const listings = await listingService.getAllListings({
            pageNo,
            pageSize,
            sortByStartDate,
            statusId,
            subcategoryId,
            categoryId,
            cityId,
            translate,
            showExternalListings,
            isAdmin,
            specificDate
        });
        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        next(err);
    }
};

const searchListings = async (req, res, next) => {
    const params = req.query;
    const {
        pageNo = 1,
        pageSize = 9,
        sortByStartDate,
        statusId,
        cityId,
        searchQuery,
    } = params;

    try {
        const listings = await listingService.searchListings({
            pageNo,
            pageSize,
            sortByStartDate,
            statusId,
            cityId,
            searchQuery,
        });

        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        next(err);
    }
};

const createListing = async (req, res, next) => {
    const { cityIds, ...listingData } = req.body;
    const { userId, roleId } = req;

    try {
        const newListing = await listingService.createListing({
            cityIds,
            listingData,
            userId,
            roleId,
        });
        if (req.version === "v0") {
            res.status(200).json({
                status: "success",
                id: newListing[0].listingId,
            });
        } else {
            res.status(200).json({
                status: "success",
                data: newListing,
            });
        }
    } catch (err) {
        next(err);
    }
};

const updateListing = async (req, res, next) => {
    const listingId = req.params.listingId;
    const { cityIds, ...listingData } = req.body;
    const { userId, roleId } = req;

    try {
        const updatedListing = await listingService.updateListing({
            listingId,
            cityIds,
            listingData,
            userId,
            roleId
        });

        res.status(200).json({
            status: "success",
            data: req.version && req.version === "v0" ? listingId : updatedListing,
        });
    } catch (err) {
        next(err);
    }
};

const getListingWithId = async function (req, res, next) {
    const id = req.params.id;
    const repeatedRequest = req.repeatedRequest;

    try {
        const data = await listingService.getListingWithId(
            id,
            repeatedRequest
        );
        if (req.version === "v0") {
            if (data && data.otherlogos) {
                data.otherLogos = data.otherlogos;
            } else if (data && data.otherLogos) {
                data.otherlogos = data.otherLogos;
            }
        }
        return res.status(200).json({
            status: "success",
            data
        });
    } catch (err) {
        return next(err);
    }
};


const deleteListing = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    try {
        await listingService.deleteListing(id, userId, roleId);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const uploadImage = async function (req, res, next) {
    const listingId = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    const imageFiles = req?.files?.image;
    const imageList = req?.body?.image;
    try {
        await listingService.uploadImage(
            listingId,
            userId,
            roleId,
            imageFiles,
            imageList
        );
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const uploadPDF = async function (req, res, next) {
    const listingId = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    const { pdf } = req.files;

    try {
        await listingService.uploadPDF(
            listingId,
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

const deleteImage = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await listingService.deleteImage(
            id,
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

const deletePDF = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await listingService.deletePDF(
            id,
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

const vote = async function (req, res, next) {
    const listingId = req.params.id;
    const optionId = req.body.optionId;
    const vote = req.body.vote;

    try {
        const voteCount = await listingService.vote(
            listingId,
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

module.exports = {
    getAllListings,
    searchListings,
    createListing,
    updateListing,
    getListingWithId,
    deleteListing,
    uploadImage,
    uploadPDF,
    deleteImage,
    deletePDF,
    vote
};