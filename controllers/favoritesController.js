const favoritesService = require("../services/favoritesService");
const AppError = require("../utils/appError");
const categoriesService = require("../services/categoryService");
const citiesService = require("../services/cities");
const listingService = require("../services/listingService");

const getAllFavoritesForUser = async function (req, res, next) {
    const userId = parseInt(req.paramUserId);
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid userId ${userId}`, 400));
        return;
    }
    if (userId !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    try {
        const response = await favoritesService.getFavoritesforUser(userId);
        res.status(200).json({
            status: "success",
            data: response,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

const getFavoriteListingsForUser = async function (req, res, next) {
    const userId = parseInt(req.paramUserId);
    const params = req.query;
    let listings = [];
    const listingFilter = {}
    const favFilter = {
        userId
    }
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid userId ${userId}`, 400));
        return;
    }
    if (userId !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    if (params.categoryId) {
        try {
            const data = await categoriesService.getCategoryById(parseInt(params.categoryId));
            if (data.length === 0) {
                return next(
                    new AppError(`Invalid Category '${params.categoryId}' given`, 400)
                );
            }
            listingFilter.categoryId = params.categoryId;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (params.cityId) {
        try {
            const cities = await citiesService.getCityWithId(parseInt(params.cityId));
            if (cities.length === 0) {
                return next(
                    new AppError(`Invalid CityId '${params.cityId}' given`, 400)
                );
            }
            favFilter.cityId = params.cityId;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        let response = await favoritesService.getFavoritesWithFilter(favFilter);
        const favDict = {};
        response.forEach((fav) => {
            const cityId = fav.cityId;
            const listingId = fav.listingId;
            if (favDict[cityId]) {
                favDict[cityId].push(listingId);
            } else {
                favDict[cityId] = [listingId];
            }
        });
        listings = [];
        for (const cityId in favDict) {
            listingFilter.id = favDict[cityId];
            response = await listingService.getAllListingsWithFilters(listingFilter, cityId);
            response.forEach((l) => (l.cityId = cityId));
            listings.push(...response);
        }
    } catch (err) {
        console.log(err);
        return next(new AppError(err));
    }
    res.status(200).json({
        status: "success",
        data: listings,
    });
};

const addNewFavoriteForUser = async function (req, res, next) {
    const userId = parseInt(req.paramUserId);
    const cityId = parseInt(req.body.cityId);
    const listingId = req.body.listingId;
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid userId ${userId}`, 400));
        return;
    }
    if (userId !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            const response = await citiesService.getCityWithId(cityId);
            if (!response) {
                return next(new AppError(`Invalid City '${cityId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        next(new AppError(`Invalid ListingsId ${listingId}`, 400));
        return;
    } else {
        try {
            const response = await listingService.getCityListingWithId(listingId, cityId);
            if (!response) {
                return next(new AppError(`Invalid listing '${listingId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
    try {
        const newID = await favoritesService.addFavoriteForUser(userId, cityId, listingId);
        res.status(200).json({
            status: "success",
            id: newID,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

const deleteFavoriteListingForUser = async function (req, res, next) {
    const favoriteId = parseInt(req.params.id);
    const userId = parseInt(req.paramUserId);
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid UserId ${userId}`, 400));
        return;
    }
    if (isNaN(Number(favoriteId)) || Number(favoriteId) <= 0) {
        next(new AppError(`Invalid favoriteId ${favoriteId}`, 400));
        return;
    }
    if (userId !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    try {
        const response = await favoritesService.getFavoritesWithFilter({ id: favoriteId });
        if (response.length === 0) {
            return next(new AppError(`Favorites with id ${favoriteId} does not exist`, 404));
        }
        await favoritesService.deleteFavorite(favoriteId);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

module.exports = {
    addNewFavoriteForUser,
    getAllFavoritesForUser,
    getFavoriteListingsForUser,
    deleteFavoriteListingForUser,
}