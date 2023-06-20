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
            const response = await database.get(tables.FORUM_MEMBERS, { forumId }, null, cityId);
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Forum not present '${forumId}' given`, 404));
            }

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
        
            res.status(200).json({
                status: "success",
                data: memberUserIds.rows,
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
	
});

module.exports = router;