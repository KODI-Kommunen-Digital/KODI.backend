const AppError = require("../utils/appError");

const favoritesRepository = require("../repository/favoritesRepo");
const citiesrepository = require("../repository/citiesRepo");
const listingRepository = require("../repository/listingsRepo");
const categoriesRepository = require("../repository/categoriesRepo");

const getAllFavoritesForUser = async function (paramUserId, userId) {
    if (isNaN(Number(paramUserId)) || Number(paramUserId) <= 0) {
        throw new AppError(`Invalid userId ${paramUserId}`, 400);
    }
    if (paramUserId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    try {
        // return await favoritesRepo.getFavoritesforUser(paramUserId);
        const response = await favoritesRepository.getAll({
            filters: [
                {
                    key: 'userId',
                    sign: '=',
                    value: paramUserId
                }
            ]
        });
        return response?.rows ?? [];
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getFavoriteListingsForUser = async function (
    paramUserId,
    userId,
    categoryId,
    cityId,
) {
    let listings = [];
    // const listingFilter = {};
    // const favFilter = {
    //     userId: paramUserId,
    // };
    const favFilters = [
        {
            key: 'userId',
            sign: '=',
            value: paramUserId
        }
    ]

    const listingFilters = [];

    if (isNaN(Number(paramUserId)) || Number(paramUserId) <= 0) {
        throw new AppError(`Invalid userId ${paramUserId}`, 400);
    }
    if (paramUserId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (categoryId) {
        try {
            // const data = await categoriesRepo.getCategoryById(categoryId);
            const data = await categoriesRepository.getAll({
                filters: [
                    {
                        key: 'id',
                        sign: '=',
                        value: categoryId
                    }
                ]
            });
            // if (data.length === 0) {
            if (!data || !data.rows || data.rows.length === 0) {
                throw new AppError(`Invalid Category '${categoryId}' given`, 400);
            }
            // listingFilter.categoryId = categoryId;
            listingFilters.push({
                key: 'categoryId',
                sign: '=',
                value: categoryId
            });
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    if (cityId) {
        try {
            // const cities = await citiesRepo.getCityWithId(cityId);
            const city = await citiesrepository.getOne({
                filters: [
                    {
                        key: 'id',
                        sign: '=',
                        value: cityId
                    }
                ]
            });
            if (!city) {
                throw new AppError(`Invalid CityId '${cityId}' given`, 400);
            }
            // favFilter.cityId = cityId;
            favFilters.push({
                key: 'cityId',
                sign: '=',
                value: cityId
            });
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    try {
        // let response = await favoritesRepo.getFavoritesWithFilter(favFilter);
        let response = await favoritesRepository.getAll({
            filters: favFilters
        });
        const favDict = {};
        response.rows.forEach((fav) => {
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
            // listingFilter.id = favDict[cityId];
            const tempLisitngFilters = [...listingFilters];
            tempLisitngFilters.push({
                key: 'id',
                sign: 'IN',
                value: favDict[cityId]
            });
            // response = await listingRepo.getAllListingsWithFiltersQuery(
            //     listingFilter,
            //     cityId,
            // );
            response = await listingRepository.getAll({
                filters: tempLisitngFilters,
                cityId
            });

            // Check if no listings were returned for a specific favorite entry
            if (!response.rows || response.rows.length === 0) {
                // Delete the favorite entry with the specific listingId
                await favoritesRepository.delete({
                    filters: [
                        { key: 'userId', sign: '=', value: paramUserId },
                        { key: 'listingId', sign: 'IN', value: favDict[cityId] }
                    ]
                });
            } else {
                response.rows.forEach((l) => (l.cityId = cityId));
                listings.push(...response.rows);
            }
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
    return listings;
};

const addNewFavoriteForUser = async function (
    paramUserId,
    userId,
    cityId,
    listingId,
) {
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
            const response = await citiesrepository.getOne({
                filters: [
                    {
                        key: 'id',
                        sign: '=',
                        value: cityId
                    }
                ]
            });
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
            // const response = await listingRepo.getCityListingWithId(
            //     listingId,
            //     cityId,
            // );
            const response = await listingRepository.getOne({
                filters: [
                    {
                        key: 'id',
                        sign: '=',
                        value: listingId
                    }
                ],
                cityId
            });
            if (!response) {
                throw new AppError(`Invalid listing '${listingId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }


    // Check if the favorite already exists
    try {
        const existingFavorite = await favoritesRepository.getOne({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: paramUserId,
                },
                {
                    key: "cityId",
                    sign: "=",
                    value: cityId,
                },
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ],
        });

        if (existingFavorite) {
            return {
                status: "success",
                message: "Favorite already exists",
                id: existingFavorite.id,
            };
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err.message || "An error occurred while checking for existing favorite");
    }
    
    try {
        // return await favoritesRepo.addFavoriteForUser(
        //     paramUserId,
        //     cityId,
        //     listingId,
        // );
        return await favoritesRepository.create({
            data: {
                userId: paramUserId,
                cityId,
                listingId
            }
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteFavoriteListingForUser = async function (
    favoriteId,
    paramUserId,
    userId,
) {
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
        // const response = await favoritesRepo.getFavoritesWithFilter({
        //     id: favoriteId,
        // });
        const response = await favoritesRepository.getAll({
            filters: [
                {
                    key: 'id',
                    sign: '=',
                    value: favoriteId
                }
            ]
        });
        if (response.length === 0) {
            throw new AppError(`Favorites with id ${favoriteId} does not exist`, 404);
        }
        // await favoritesRepo.deleteFavorite(favoriteId);
        await favoritesRepository.delete({
            filters: [
                {
                    key: 'id',
                    sign: '=',
                    value: favoriteId
                }
            ]
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    addNewFavoriteForUser,
    getAllFavoritesForUser,
    getFavoriteListingsForUser,
    deleteFavoriteListingForUser,
};
