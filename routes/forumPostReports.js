const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

router.post("/", authentication, async function (req, res, next) {
    const postId = req.postId;
    const payload = req.body;
    const cityId = req.cityId;
    const forumId = req.forumId;
    const userId = req.userId;

    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }
    if (!cityId) {
        return next(new AppError(`City is not present`, 400));
    } else {
        try {
            if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
                next(new AppError(`Invalid cityId ${cityId}`, 400));
                return;
            }
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`City '${cityId}' not present`, 404)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        const response = await database.get(tables.USER_TABLE, { id: userId });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Invalid User '${userId}' given`, 400));
        }
    } catch (err) {
        return next(new AppError(err));
    }

    if (!forumId) {
        return next(new AppError(`ForumId is not present`, 400));
    } else {
        try {
            if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
                next(new AppError(`Invalid forumId ${forumId}`, 400));
                return;
            }
            const response = await database.get(
                tables.FORUMS,
                {
                    id: forumId,
                },
                null,
                cityId
            );
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Forum Id'${forumId}' not present`, 404)
                );
            }

            const forumUser = await database.get(
                tables.FORUM_MEMBERS,
                {
                    forumId,
                    userId,
                },
                null,
                cityId
            );

            if (forumUser.rows && forumUser.rows.length === 0) {
                return next(
                    new AppError(
                        `User Not found in This Forum '${forumId}' given`,
                        400
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (!postId) {
        return next(new AppError(`PostId is not present`, 400));
    } else {
        if (isNaN(Number(postId)) || Number(postId) <= 0) {
            next(new AppError(`Invalid postId ${postId}`, 400));
            return;
        }

        try {
            const cityUserResponse = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, { userId, cityId });
            if (cityUserResponse.rows && cityUserResponse.rows.length === 0) {
                return next(new AppError(`Invalid User '${userId}' given`, 400));
            }
            const cityUserId = cityUserResponse.rows[0];
            const forumPost = await database.get(
                tables.FORUMS_POST,
                {
                    id: postId,
                },
                null,
                cityId
            );

            if (forumPost.rows && forumPost.rows.length === 0) {
                next(new AppError(`Post Id'${postId}' not present`, 404));
                return;
            }

            const currentTime = new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")
            const response = await database.create(
                tables.POST_REPORTS,
                { forumId,
                    userId: cityUserId,
                    postId,
                    createdAt: currentTime
                },
                cityId
            );

            return res.status(200).json({
                status: "success",
                id: response.id
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
});

router.get("/", authentication, async function (req, res, next) {
    const postId = req.postId;
    const payload = req.body;
    const cityId = req.cityId;
    const forumId = req.forumId;
    const userId = req.userId;

    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }
    if (!cityId) {
        return next(new AppError(`City is not present`, 400));
    } else {
        try {
            if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
                next(new AppError(`Invalid cityId ${cityId}`, 400));
                return;
            }
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`City '${cityId}' not present`, 404)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        const response = await database.get(tables.USER_TABLE, { id: userId });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Invalid User '${userId}' given`, 400));
        }
    } catch (err) {
        return next(new AppError(err));
    }

    if (!forumId) {
        return next(new AppError(`ForumId is not present`, 400));
    } else {
        try {
            if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
                next(new AppError(`Invalid forumId ${forumId}`, 400));
                return;
            }
            const response = await database.get(
                tables.FORUMS,
                {
                    id: forumId,
                },
                null,
                cityId
            );
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Forum Id'${forumId}' not present`, 404)
                );
            }

            const forumUser = await database.get(
                tables.FORUM_MEMBERS,
                {
                    forumId,
                    userId,
                },
                null,
                cityId
            );

            if (forumUser.rows && forumUser.rows.length === 0) {
                return next(
                    new AppError(
                        `User Not found in This Forum '${forumId}' given`,
                        400
                    )
                );
            }

            if (!forumUser.rows[0].isAdmin) {
                return next(
                    new AppError(
                        `Only admins can call this endpoint`,
                        403
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (!postId) {
        return next(new AppError(`PostId is not present`, 400));
    } else {
        try {
            if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
                next(new AppError(`Invalid postId ${postId}`, 400));
                return;
            }
            const forumPost = await database.get(
                tables.FORUMS_POST,
                {
                    id: postId,
                },
                null,
                cityId
            );

            if (forumPost.rows && forumPost.rows.length === 0) {
                next(new AppError(`Post Id'${postId}' not present`, 404));
                return;
            }

            const response = await database.get(
                tables.POST_REPORTS,
                { 
                    forumId,
                    postId
                },
                cityId
            );

            return res.status(200).json({
                status: "success",
                id: response.rows
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
}

);

module.exports = router;
