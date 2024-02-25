const favoritesRepo = require("../repository/favorites");
const AppError = require("../utils/appError");
const categoriesRepo = require("../repository/category");
const citiesRepo = require("../repository/cities");
const listingRepo = require("../repository/listings");

const getAllFavoritesForUser = async function (paramUserId, userId) {
    if (isNaN(Number(paramUserId)) || Number(paramUserId) <= 0) {
        throw new AppError(`Invalid userId ${paramUserId}`, 400);
    }
    if (paramUserId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    try {
        return await favoritesRepo.getFavoritesforUser(paramUserId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const getFavoriteListingsForUser = async function (paramUserId, userId, categoryId, cityId,) {
    let listings = [];
    const listingFilter = {}
    const favFilter = {
        userId: paramUserId
    }
    if (isNaN(Number(paramUserId)) || Number(paramUserId) <= 0) {
        throw new AppError(`Invalid userId ${paramUserId}`, 400);
    }
    if (paramUserId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (categoryId) {
        try {
            const data = await categoriesRepo.getCategoryById(categoryId);
            if (data.length === 0) {
                throw new AppError(`Invalid Category '${categoryId}' given`, 400);
            }
            listingFilter.categoryId = categoryId;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    if (cityId) {
        try {
            const cities = await citiesRepo.getCityWithId(cityId);
            if (cities.length === 0) {
                throw new AppError(`Invalid CityId '${cityId}' given`, 400);
            }
            favFilter.cityId = cityId;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    try {
        let response = await favoritesRepo.getFavoritesWithFilter(favFilter);
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
            response = await listingRepo.getAllListingsWithFilters(listingFilter, cityId);
            response.forEach((l) => (l.cityId = cityId));
            listings.push(...response);
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
    return listings;
};

const addNewFavoriteForUser = async function (paramUserId, userId, cityId, listingId) {
    if (isNaN(Number(paramUserId)) || Number(paramUserId) <= 0) {
        throw new AppError(`Invalid userId ${paramUserId}`, 400);
    }
    if (paramUserId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        throw new AppError(`Invalid cityId`, 400);
    } else {
        try {
            const response = await citiesRepo.getCityWithId(cityId);
            if (!response) {
                throw new AppError(`Invalid City '${cityId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId}`, 400);

    } else {
        try {
            const response = await listingRepo.getCityListingWithId(listingId, cityId);
            if (!response) {
                throw new AppError(`Invalid listing '${listingId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
    try {
        return await favoritesRepo.addFavoriteForUser(paramUserId, cityId, listingId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const deleteFavoriteListingForUser = async function (favoriteId, paramUserId, userId) {
    if (isNaN(Number(paramUserId)) || Number(paramUserId) <= 0) {
        throw new AppError(`Invalid UserId ${paramUserId}`, 400);
    }
    if (isNaN(Number(favoriteId)) || Number(favoriteId) <= 0) {
        throw new AppError(`Invalid favoriteId ${favoriteId}`, 400);
    }
    if (paramUserId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    try {
        const response = await favoritesRepo.getFavoritesWithFilter({ id: favoriteId });
        if (response.length === 0) {
            throw new AppError(`Favorites with id ${favoriteId} does not exist`, 404);
        }
        await favoritesRepo.deleteFavorite(favoriteId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

module.exports = {
    addNewFavoriteForUser,
    getAllFavoritesForUser,
    getFavoriteListingsForUser,
    deleteFavoriteListingForUser,
}