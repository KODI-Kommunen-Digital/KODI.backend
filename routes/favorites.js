const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const { getAllFavoritesForUser, getFavoriteListingsForUser, addNewFavoriteForUser } = require("../controllers/favoritesController");

// To get the favorite ID  of a user
router.get("/", authentication, getAllFavoritesForUser);
// To get all the listings from the favorite table
router.get("/listings", authentication, getFavoriteListingsForUser);

// To insert or add  a listing into favorite table
router.post("/", authentication, addNewFavoriteForUser);

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
