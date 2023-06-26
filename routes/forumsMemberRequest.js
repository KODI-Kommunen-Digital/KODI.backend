const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

router.post("/", authentication, async function (req, res, next) {
    const cityId = req.cityId
    const forumId = req.forumId
    const payload = req.body;
    let forum = {};
    const insertionData = {};

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
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

    if (!forumId) {
        return next(new AppError(`forumId is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.FORUMS, { id: forumId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Invalid Forum '${forumId}' given`, 400));
            }
            forum = response.rows[0]
        } catch (err) {
            return next(new AppError(err));
        }
    }
    insertionData.forumId = forumId

    if (!payload.userId) {
        return next(new AppError(`userId is not present`, 400));
    } else {
        try {
            const response = await database.get(tables.USER_TABLE, { id: payload.userId });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`User with userId ${payload.userId} not present`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
    insertionData.userId = payload.userId

    if (!forum.isPrivate) {
        insertionData.JoinedAt = new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
        try {
            await database.create(tables.FORUM_MEMBERS, insertionData, cityId)
        } catch (err) {
            return next(new AppError(err));
        }
        return res.status(200).json({
            status: "success",
            data: {
                message: "Member added successfully",
            }
        });
    } else {
        insertionData.statusId = 1
        insertionData.createdAt = new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
        insertionData.updatedAt = insertionData.createdAt
        try {
            await database.create(tables.FORUM_REQUEST, insertionData, cityId)
        } catch (err) {
            return next(new AppError(err));
        }
        return res.status(200).json({
            status: "success",
            data: {
                message: "Request sent successfully",
            }
        });
    }
});

// router.get("/", authentication, async function(req, res, next){
//     const cityId = req.cityId
//     const forumId = req.forumId
//     const payload = req.body;
// });

module.exports = router;