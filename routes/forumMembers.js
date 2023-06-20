const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");


router.get("/", authentication, async function (req, res, next) {
    const forumId = req.forumId
    const cityId = req.cityId;

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`City not present '${cityId}' given`, 404));
            }
            if (!response.rows[0].hasForums) {
                next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 403));
            }
        } catch (err) {
            return next(new AppError(err));
        }	
    }

    if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
        return next(new AppError(`Invalid forumId`, 400));
    } else {
        try {
            let response = await database.get(tables.FORUMS, { id: forumId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Forum not present '${forumId}' given`, 404));
            }

            response = await database.get(tables.FORUM_MEMBERS, { forumId }, null, cityId);

            const memberCityUserIds = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
                cityUserId: response.rows.map(x => {
                    return x.userId
                })
            }, null);

            const memberUserIds = await database.get(tables.USER_TABLE, {
                id: memberCityUserIds.rows.map(x => {
                    return x.userId
                })
            },
            {
                columns: [
                    "id",
                    "username",
                    "firstname",
                    "lastname",
                    "email",
                    "phoneNumber"
                ]
            })

            if (!memberUserIds.find(u => u.id === req.userId)) {
                return next(new AppError(`You are not allowed to access this resource`, 403));
            }
        
            res.status(200).json({
                status: "success",
                data: memberUserIds.rows,
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
	
});

router.delete("/:id", authentication, async function (req, res, next) {
    const forumId = req.forumId
    const cityId = req.cityId;
    const userId = req.userId;
    const memberId = req.params.id;

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`City not present '${cityId}' given`, 404));
            }
            if (!response.rows[0].hasForums) {
                next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 403));
            }
        } catch (err) {
            return next(new AppError(err));
        }	
    }

    if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
        return next(new AppError(`Invalid forumId`, 400));
    } else {
        try {
            let response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, { userId, cityId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Forum not present '${forumId}' given`, 404));
            }
            const cityUserId = response[0].cityUserId;

            response = await database.get(tables.FORUMS, { id: forumId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Forum not present '${forumId}' given`, 404));
            }

            response = await database.get(tables.FORUM_MEMBERS, { forumId, userId: cityUserId }, null, cityId);
            if (response.id !== memberId || !response.isAdmin) {
                return next(new AppError(`You are not allowed to call this endpoint`, 403));
            }
            await database.deleteData(tables.FORUM_MEMBERS, { forumId, userId: cityUserId }, cityId);

            res.status(200).json({
                status: "success"
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
	
});


router.patch("/:id", authentication, async function (req, res, next) {
    const forumId = req.forumId
    const cityId = req.cityId;
    const userId = req.userId;
    const memberId = req.params.id;
    const payload = req.body;

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`City not present '${cityId}' given`, 404));
            }
            if (!response.rows[0].hasForums) {
                next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 403));
            }
        } catch (err) {
            return next(new AppError(err));
        }	
    }

    if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
        return next(new AppError(`Invalid forumId`, 400));
    } else {
        try {
            let response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, { userId, cityId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Forum not present '${forumId}' given`, 404));
            }
            const cityUserId = response[0].cityUserId;

            response = await database.get(tables.FORUMS, { id: forumId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Forum not present '${forumId}' given`, 404));
            }

            response = await database.get(tables.FORUM_MEMBERS, { forumId, userId: cityUserId }, null, cityId);
            const updationData = {};

            if (payload.isAdmin) {
                if (!response.isAdmin) {
                    return next(new AppError(`You are not allowed to call this endpoint`, 403));
                } else {
                    updationData.isAdmin = response.isAdmin;
                }
            }

            if (updationData) {
                await database.update(tables.FORUM_MEMBERS, updationData, { id: memberId }, cityId);
            }

            res.status(200).json({
                status: "success"
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
	
});
module.exports = router;