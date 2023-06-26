const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

// Return all forums in a city
router.get("/", async function (req, res, next) {
    const cityId = req.cityId;
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        next(new AppError(`Invalid forumId ${cityId}`, 400));
        return;
    }
    const response = await database.get(tables.CITIES_TABLE, { cityId });
    if (response && response.length > 0) {
        next(new AppError(`CityId ${cityId} not present`, 404));
    }

    if (!response.rows[0].hasForums) {
        next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 400));
    }

    database
        .get(tables.FORUMS,null,null,cityId)
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

//  Get a particular forum
router.get("/:id", async function (req, res, next) {
    const forumsId = req.params.id;
    const cityId = req.cityId;

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        next(new AppError(`Invalid forumId ${cityId}`, 400));
        return;
    }

    const response = await database.get(tables.CITIES_TABLE, { cityId });
    if (response && response.length > 0) {
        next(new AppError(`CityId ${cityId} not present`, 404));
    }

    if (!response.rows[0].hasForums) {
        next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 403));
    }

    if (isNaN(Number(forumsId)) || Number(forumsId) <= 0) {
        next(new AppError(`Invalid forumId ${forumsId}`, 400));
        return;
    }
 
    database
        .get(tables.FORUMS, { id: forumsId }, null, cityId)
        .then((response) => {
            const data = response.rows;
            if (!data || data.length === 0) {
                return next(new AppError(`Forums with id ${forumsId} does not exist`, 404));
            }
            res.status(200).json({
                status: "success",
                data: data[0],
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

// To insert or add  a post into forums table  works fine but doesn't get updated in db
router.post("/", authentication, async function (req, res, next) {
    const payload = req.body
    const cityId = req.cityId;
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`City not present '${cityId}' given`, 404));
            }
            if (!response.rows[0].hasForum) {
                next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 403));
            }
        } catch (err) {
            return next(new AppError(err));
        }	
    }

    if (!payload.title) {
        return next(new AppError(`Title is not present`, 400));
    }

    if (!payload.description) {
        return next(new AppError(`Description is not present`, 400));
    }

    if (!payload.isPrivate) {
        return next(new AppError(`IsPrivate not present`, 400));
    }
    
    if (payload.isPrivate !== false && payload.isPrivate !== true) {
        return next(new AppError(`Invalid value for isPrivate`, 400));
    }

    const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")

    try {
        let insertionData = {
            forumName: payload.title,
            image: payload.image,
            description: payload.description,
            isPrivate: payload.isPrivate,
            createdAt: currentTime
        }

        let response = await database.create(tables.FORUMS, insertionData, cityId);
        const forumId = response.id;


        response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
            cityId,
            userId: req.userId
        });

        let cityUserId = 0;
        if (!response.rows || response.rows.length === 0) {
            const userResponse = await database.get(tables.USER_TABLE, { id: req.userId });
            const user = userResponse.rows[0];
            const userId = user.id;
            delete user.id;
            delete user.password;
            delete user.socialMedia;
            delete user.emailVerified;
            delete user.socialMedia;
            response = await database.create(tables.USER_TABLE, user, cityId);
            cityUserId = response.id;
            await database.create(tables.USER_CITYUSER_MAPPING_TABLE, {
                cityId,
                userId,
                cityUserId
            });
        } else {
            cityUserId = response.rows[0].cityUserId;
        }

        insertionData = {
            forumId,
            userId: cityUserId,
            JoinedAt: currentTime,
            isAdmin: true
        }

        response = await database.create(tables.FORUM_MEMBERS, insertionData, cityId);

        return res.status(200).json({
            status: "success",
            id: forumId
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

//  Description Update a forum. (Only admins can do this)
router.patch("/:id", authentication, async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;
    const payload = req.body;
    const updationData = {};

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid forumId ${id}`, 404));
        return;
    }

    try {
        const response = await database.get(tables.FORUMS, { id},null,cityId);
        if (!response.rows || response.rows.length === 0) {
            return next(new AppError(`ForumId ${id} does not exist`, 404));
        }

        const memberCityUserId = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
            userId: req.userId, cityId
        }, null)
    
        const userDetails = await database.get(tables.FORUM_MEMBERS, { forumId: id, userId: memberCityUserId.rows[0].cityUserId }, null, cityId);
        if (!userDetails.rows || userDetails.rows.length>0 || !userDetails.rows[0].isAdmin) {
            return next(
                new AppError(`You are not allowed to access this resource`, 403)
            );
        }
    
        if (!response.rows || response.rows.length === 0) {
            return next(
                new AppError(`You are not allowed to access this resource`, 403)
            );
        }
    } catch (err) {
        return next(new AppError(err));
    }

    if (payload.title) {
        if (payload.title.length > 255) {
            return next(
                new AppError(`Length of forum name cannot exceed 255 characters`, 400)
            );
        }
        updationData.forumName = payload.title;
    }

    if (payload.description) {
        if (payload.description.length > 10000) {
            return next(
                new AppError(
                    `Length of Description cannot exceed 10000 characters`,
                    400
                )
            );
        }
        updationData.description = payload.description;
    }
   
    if (payload.image && payload.removeImage) {
        return next(
            new AppError(
                `Invalid Input, image and removeImage both fields present`,
                400
            )
        );
    }
    if (payload.image) {
        updationData.image = payload.image;
    }
    if (payload.removeImage) {
        updationData.image = null;
    }

        
    database
        .update(tables.FORUMS, updationData, { id }, cityId)
        .then(() => {
            res.status(200).json({
                status: "success",
                data: id
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

// To delete  a forum listing from forums table shows 500 bad request
router.delete("/:id", authentication, async function (req, res, next) { 
    // We need to delete all forum related data first. 
    // Delete posts, members, comments, then the forum.
    // Let this logic be be in a Stored procedure


});
module.exports = router;