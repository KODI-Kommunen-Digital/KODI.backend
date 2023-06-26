const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

router.get("/", authentication, async function (req, res, next) {
    const params = req.query;
    const cityId = req.cityId;
    const forumId = req.forumId;
    const userId = req.userId;
    const filters = {};
    let forum = {};
    let isAdmin = false;
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;

    if (!cityId) {
        return next(new AppError(`City is not present`, 400));
    } else {
        if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            next(new AppError(`Invalid cityId ${cityId}`, 400));
            return;
        }
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Invalid City '${cityId}' given`, 404)
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
                next(new AppError(`Invalid forumId ${cityId}`, 400));
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
                    new AppError(`Forum '${forumId}' not present`, 404)
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
                        `User Not found in This Forum  '${forumId}' given`,
                        400
                    )
                );
            }
            isAdmin = forumUser.rows[0].isAdmin;
            forum = response.rows[0];
            filters.forumId = forum.id;
            if (isAdmin && params.includeHidden !== "true") {
                filters.isHidden = false;
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
    if (params.postId) {
        filters.id = params.postId;
    }

    try {
        let response = {};
        response = await database.get(
            tables.FORUMS_POST,
            filters,
            null,
            cityId,
            pageNo,
            pageSize
        );
        return res.status(200).json({
            status: "success",
            posts: response.rows,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/", authentication, async function (req, res, next) {
    const payload = req.body;
    const cityId = req.cityId;
    const forumId = req.forumId;
    const insertionData = {};
    let user = {};
    let userId = req.userId;
    let forum = {};

    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Invalid City '${cityId}' given`, 400)
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
        user = data[0];
        insertionData.userId = user.id;
    } catch (err) {
        return next(new AppError(err));
    }

    if (!forumId) {
        return next(new AppError(`ForumId is not present`, 404));
    } else {
        try {
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
                    new AppError(`Invalid Forum '${forumId}' given`, 400)
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
                        `User Not found in This Forum  '${forumId}' given`,
                        400
                    )
                );
            }
            forum = response.rows[0];
            insertionData.forumId = forum.id;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (!payload.description) {
        return next(new AppError(`Description is not present`, 400));
    } else if (payload.description.length > 10000) {
        return next(
            new AppError(
                `Length of Description cannot exceed 10000 characters`,
                400
            )
        );
    } else {
        insertionData.description = payload.description;
    }

    if (!payload.title) {
        return next(new AppError(`Title is not present`, 400));
    } else if (payload.title.length > 255) {
        return next(
            new AppError(`Length of Title cannot exceed 255 characters`, 400)
        );
    } else {
        insertionData.title = payload.title;
    }
    if (payload.image) {
        insertionData.image = payload.image;
    }
    if (payload.isHidden) {
        if (typeof payload.isHidde === "boolean") {
            insertionData.isHidden = payload.isHidden;
        } else {
            next(new AppError(`Invalid type isHidden`, 400));
        }
    } else {
        insertionData.isHidden = false;
    }

    insertionData.createdAt = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    try {
        let response = {};
        userId = user.id;
        // if (city.isAdminListings) {
        //     // If the city is admin listings, we need directly set the user id of the listing as 1 (i.e. admin's id)
        //     insertionData.userId = 1;
        // } else {
        //     response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
        //         cityId,
        //         userId,
        //     });
        //     if (!response.rows || response.rows.length === 0) {
        //         delete user.id;
        //         delete user.password;
        //         delete user.socialMedia;
        //         delete user.emailVerified;
        //         delete user.socialMedia;
        //         response = await database.create(
        //             tables.USER_TABLE,
        //             user,
        //             cityId
        //         );
        //         let cityUserId = response.id;
        //         await database.create(tables.USER_CITYUSER_MAPPING_TABLE, {
        //             cityId,
        //             userId,
        //             cityUserId,
        //         });
        //         insertionData.userId = cityUserId;
        //     } else {
        //         insertionData.userId = response.rows[0].cityUserId;
        //     }
        // }

        response = await database.create(
            tables.FORUMS_POST,
            insertionData,
            cityId
        );
        // await database.create(tables.USER_LISTING_MAPPING_TABLE, {
        //     cityId,
        //     userId,
        //     listingId,
        // });
        return res.status(200).json({
            status: "success",
            id: response.id,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.patch("/:id", authentication, async function (req, res, next) {
    const params = req.query;
    const postId = params.postId;
    const payload = req.body;
    const cityId = req.cityId;
    const forumId = req.params.id;
    const updationData = {};
    let isAdmin = false;
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
            isAdmin = forumUser.rows[0].isAdmin;
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
        const forumPost = await database.get(
            tables.FORUMS_POST,
            {
                id: postId,
            },
            null,
            cityId
        );

        if (forumPost.rows && forumPost.rows.length === 0) {
            return next(
                new AppError(`Post Id'${postId}' not present`, 404)
            )
        }

        if (!isAdmin && userId !== forumPost.rows[0].userId) {
            return next(
                new AppError(`You are not allowed to access this resource`, 403)
            );
        }
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

    if (payload.title) {
        if (payload.title.length > 255) {
            return next(
                new AppError(
                    `Length of Title cannot exceed 255 characters`,
                    400
                )
            );
        }
        updationData.title = payload.title;
    }
    if (payload.image) {
        updationData.image = payload.image;
    }

    if (payload.isHidden) {
        if (!isAdmin) {
            next(new AppError(`Only admins can update this field`, 403));
        }
        if (typeof payload.isHidden === "boolean") {
            updationData.isHidden = payload.isHidden;
        } else {
            next(new AppError(`Invalid type isHidden`, 400));
        }
    }

    try {
        const response = await database.update(
            tables.FORUMS_POST,
            updationData,
            { id: postId },
            cityId
        );

        return res.status(200).json({
            status: "success",
            id: response[0].id
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.get("/:id/comments", authentication, async function (req, res, next) {
    const params = req.query;
    const cityId = req.cityId;
    const forumId = req.forumId;
    const userId = req.userId;
    const filters = {};
    let forum = {};
    let isAdmin = false;
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Invalid City '${cityId}' given`, 400)
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
        return next(new AppError(`ForumId is not present`, 404));
    } else {
        try {
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
                    new AppError(`Invalid Forum '${forumId}' given`, 400)
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
                        `User Not found in This Forum  '${forumId}' given`,
                        400
                    )
                );
            }
            isAdmin = forumUser.rows[0].isAdmin;
            forum = response.rows[0];
            filters.forumId = forum.id;
            if (isAdmin && params.includeHidden !== "true") {
                filters.isHidden = false;
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
    if (params.postId) {
        filters.id = params.postId;
    }

    try {
        let response = {};
        response = await database.get(
            tables.FORUM_COMMENTS,
            filters,
            null,
            cityId,
            pageNo,
            pageSize
        );
        const forumPosts = response.rows;
        return res.status(200).json({
            status: "success",
            posts: forumPosts,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/:id/comments", authentication, async function (req, res, next) {
    const payload = req.body;
    const cityId = req.cityId;
    const forumId = req.forumId;
    const postId = req.params.id;
    const insertionData = {};
    let user = {};
    const userId = req.userId;
    let forum = {};

    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Invalid City '${cityId}' given`, 400)
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
        user = data[0];
        insertionData.userId = user.id;
    } catch (err) {
        return next(new AppError(err));
    }

    if (!forumId) {
        return next(new AppError(`ForumId is not present`, 404));
    } else {
        try {
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
                    new AppError(`Invalid Forum '${forumId}' given`, 400)
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
                        `User Not found in This Forum  '${forumId}' given`,
                        400
                    )
                );
            }
            forum = response.rows[0];
            insertionData.forumId = forum.id;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (!postId) {
        return next(new AppError(`PostId is not given`, 404));
    } else {
        try {
            const response = await database.get(
                tables.FORUMS_POST,
                {
                    id: postId,
                },
                null,
                cityId
            );
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Invalid Post '${postId}' given`, 400)
                );
            }
            const post = response.rows[0];
            insertionData.postId = post.id;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (!payload.comment) {
        return next(new AppError(`Comment is not present`, 400));
    } else if (payload.comment.length > 1000) {
        return next(
            new AppError(`Length of Comment cannot exceed 1000 characters`, 400)
        );
    } else {
        insertionData.comments = payload.comment;
    }

    insertionData.createdAt = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    try {
        let response = {};
        response = await database.create(
            tables.FORUM_COMMENTS,
            insertionData,
            cityId
        );
        const postCommentId = response.id;
        return res.status(200).json({
            status: "success",
            id: postCommentId,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});
module.exports = router;
