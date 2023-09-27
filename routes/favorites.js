const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

// To get the favorite ID  of a user
router.get("/", authentication, async function (req, res, next) {
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

    database
        .get(tables.FAVORITES_TABLE, { userId })
        .then((response) => {
            res.status(200).json({
                status: "success",
                data: response.rows,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});
// To get all the listings from the favorite table
router.get("/listings", authentication, async function (req, res, next) {
    const userId = parseInt(req.paramUserId);
    const params = req.query;
    const cityId = null;
    let listings = [];
    const listingFilter = {}
    let favFilter = {
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
            let response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: params.categoryId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
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
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: params.cityId },
                null
            );
            cities = response.rows;
            if (cities && cities.length === 0) {
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
        let response = await database.get(tables.FAVORITES_TABLE, favFilter);
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
            listingFilter.id = favDict[cityId];
            response = await database.get(
                tables.LISTINGS_TABLE,
                listingFilter,
                null,
                cityId
            );
            response.rows.forEach((l) => (l.cityId = cityId));
            listings.push(...response.rows);
        }
    } catch (err) {
        return next(new AppError(err));
    }
    res.status(200).json({
        status: "success",
        data: listings,
    });
});

// To insert or add  a listing into favorite table
router.post("/", authentication, async function (req, res, next) {
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
            const response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length === 0) {
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
            const response = await database.get(
                tables.LISTINGS_TABLE,
                { id: listingId },
                null,
                cityId
            );
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Invalid listing '${listingId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
    const response = await database.create(tables.FAVORITES_TABLE, {
        userId,
        cityId,
        listingId,
    });
    res.status(200).json({
        status: "success",
        id: response.id,
    });
});

// To delete  a favorite listing from favorite table
router.delete("/:id", authentication, async function (req, res, next) {
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
        const response = await database.get(tables.FAVORITES_TABLE, {
            id: favoriteId,
        });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Favorites with id ${favoriteId} does not exist`, 404));
        }
        await database.deleteData(tables.FAVORITES_TABLE, { id: favoriteId });

        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});
module.exports = router;
