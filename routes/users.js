const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const axios = require("axios");
const parser = require("xml-js");
const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const { register, login, getUserById, updateUser, refreshAuthToken, forgotPassword, resetPassword, sendVerificationEmail, verifyEmail, logout, getUsers, listLoginDevices, deleteLoginDevices, uploadUserProfileImage, deleteUserProfileImage } = require("../controllers/userController");

router.post("/login", login);

router.post("/register", register);

router.get("/:id", getUserById);

router.patch("/:id", authentication, updateUser);

router.delete("/:id", authentication, async function (req, res, next) {
    const id = parseInt(req.params.id);

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    if (id !== req.userId) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    try {
        let response = await database.get(tables.USER_TABLE, { id });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }

        response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
            userId: id,
        });
        const cityUsers = response.rows;

        let imageList = await axios.get(
            "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST
        );
        imageList = JSON.parse(
            parser.xml2json(imageList.data, { compact: true, spaces: 4 })
        );
        const userImageList = imageList.ListBucketResult.Contents.filter(
            (obj) => obj.Key._text.includes("user_" + id)
        );

        const onSucccess = async () => {
            for (const cityUser of cityUsers) {
                await database.deleteData(
                    tables.LISTINGS_TABLE,
                    { userId: cityUser.cityUserId },
                    cityUser.cityId
                );
                await database.deleteData(
                    tables.USER_TABLE,
                    { id: cityUser.cityUserId },
                    cityUser.cityId
                );
            }
            await database.deleteData(tables.USER_CITYUSER_MAPPING_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.USER_LISTING_MAPPING_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.FAVORITES_TABLE, { userId: id });
            await database.deleteData(tables.USER_TABLE, { id });

            return res.status(200).json({
                status: "success",
            });
        };

        const onFail = (err) => {
            return next(
                new AppError("Image Delete failed with Error Code: " + err)
            );
        };
        await imageDeleteMultiple(
            userImageList.map((image) => ({ Key: image.Key._text })),
            onSucccess,
            onFail
        );
    } catch (err) {
        return next(new AppError(err));
    }
});



router.delete("/:id/imageDelete", authentication, deleteUserProfileImage);

router.post("/:id/imageUpload", authentication, uploadUserProfileImage);

router.get("/:id/listings", async function (req, res, next) {
    const userId = req.params.id;
    const pageNo = req.query.pageNo || 1;
    const pageSize = req.query.pageSize || 9;

    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid UserId ${userId}`, 400));
        return;
    }

    const filters = {};
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(
            new AppError(`Please enter a positive integer for pageNo`, 400)
        );
    }

    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        return next(
            new AppError(
                `Please enter a positive integer less than or equal to 20 for pageSize`,
                400
            )
        );
    }

    if (req.query.statusId) {
        try {
            const response = await database.get(
                tables.STATUS_TABLE,
                { id: req.query.statusId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(
                        `Invalid Status '${req.query.statusId}' given`,
                        400
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.statusId = req.query.statusId;
    }

    if (req.query.categoryId) {
        try {
            const response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: req.query.categoryId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(
                        `Invalid Category '${req.query.categoryId}' given`,
                        400
                    )
                );
            } else {
                if (req.query.subcategoryId) {
                    try {
                        const response = database.get(
                            tables.SUBCATEGORIES_TABLE,
                            {
                                categoryId: req.query.categoryId,
                                id: req.query.subcategoryId,
                            }
                        );
                        const data = response.rows;
                        if (data && data.length === 0) {
                            return next(
                                new AppError(
                                    `Invalid subCategory '${req.query.subcategoryId}' given`,
                                    400
                                )
                            );
                        }
                    } catch (err) {
                        return next(new AppError(err));
                    }
                    filters.subcategoryId = req.query.subcategoryId;
                }
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.categoryId = req.query.categoryId;
    }

    try {
        let response = await database.callQuery(
            "Select cityId, userId, cityUserId, inCityServer from cities c inner join user_cityuser_mapping m on c.id = m.cityId where userId = ?;",
            [userId]
        );
        const cityMappings = response.rows;
        const individualQueries = [];
        for (const cityMapping of cityMappings) {
            // if the city database is present in the city's server, then we create a federated table in the format
            // heidi_city_{id}_listings and heidi_city_{id}_users in the core databse which points to the listings and users table respectively
            let query = `SELECT *, ${cityMapping.cityId
            } as cityId FROM heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."
            }listings WHERE userId = ${cityMapping.cityUserId}`;
            if (filters.categoryId || filters.statusId) {
                if (filters.categoryId) {
                    query += ` AND categoryId = ${filters.categoryId}`;
                }
                if (filters.subcategoryId) {
                    query += ` AND subcategoryId = ${filters.subcategoryId}`;
                }
                if (filters.statusId) {
                    query += ` AND statusId = ${filters.statusId}`;
                }
            }
            individualQueries.push(query);
        }
        if (individualQueries && individualQueries.length > 0) {
            const query = `select * from (
					${individualQueries.join(" union all ")}
				) a order by createdAt desc LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};`;
            response = await database.callQuery(query);
            return res.status(200).json({
                status: "success",
                data: response.rows,
            });
        }
        return res.status(200).json({
            status: "success",
            data: [],
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/:id/refresh", refreshAuthToken);

router.post("/forgotPassword", forgotPassword);

router.post("/resetPassword", resetPassword);

router.post("/sendVerificationEmail", sendVerificationEmail);

router.post("/verifyEmail", verifyEmail);

router.post("/:id/logout", authentication, logout);

router.get("/", getUsers);

router.post("/:id/loginDevices", authentication, listLoginDevices);

router.delete("/:id/loginDevices", authentication, deleteLoginDevices);

module.exports = router;
