const favoritesService = require("../services/favoritesService");
const AppError = require("../utils/appError");

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

module.exports = {
    getAllFavoritesForUser
}