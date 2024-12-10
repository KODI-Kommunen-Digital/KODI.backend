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
    } = params;

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

        res.status(200).json({
            status: "success",
            data: newListing,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllListings,
    searchListings,
    createListing,
};
