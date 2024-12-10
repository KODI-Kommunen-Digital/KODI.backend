const favoritesService = require("../services/favorites");

const getAllFavoritesForUser = async function (req, res, next) {
    const paramUserId = parseInt(req.paramUserId);
    const userId = parseInt(req.userId);
    try {
        const data = await favoritesService.getAllFavoritesForUser(
            paramUserId,
            userId,
        );
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const getFavoriteListingsForUser = async function (req, res, next) {
    try {
        const paramUserId = parseInt(req.paramUserId);
        const userId = parseInt(req.userId);
        const categoryId = parseInt(req.query.categoryId);
        const cityId = parseInt(req.query.cityId);
        const data = await favoritesService.getFavoriteListingsForUser(
            paramUserId,
            userId,
            categoryId,
            cityId,
        );
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const addNewFavoriteForUser = async function (req, res, next) {
    try {
        const paramUserId = parseInt(req.paramUserId);
        const userId = parseInt(req.userId);
        const cityId = parseInt(req.body.cityId);
        const listingId = req.body.listingId;

        const id = await favoritesService.addNewFavoriteForUser(
            paramUserId,
            userId,
            cityId,
            listingId,
        );
        res.status(200).json({
            status: "success",
            id,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteFavoriteListingForUser = async function (req, res, next) {
    try {
        const favoriteId = parseInt(req.params.id);
        const paramUserId = parseInt(req.paramUserId);
        const userId = parseInt(req.userId);
        await favoritesService.deleteFavoriteListingForUser(
            favoriteId,
            paramUserId,
            userId,
        );
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    addNewFavoriteForUser,
    getAllFavoritesForUser,
    getFavoriteListingsForUser,
    deleteFavoriteListingForUser,
};
