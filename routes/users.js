const express = require("express");
const router = express.Router();
const database = require("../services/database");
const sendMail = require("../services/sendMail");
const supportedSocialMedia = require("../constants/supportedSocialMedia");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const tokenUtil = require("../utils/token");
const authentication = require("../middlewares/authentication");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");
const parser = require("xml-js");
const imageUpload = require("../utils/imageUpload");
const objectDelete = require("../utils/imageDelete");
const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const roles = require("../constants/roles");
const errorCodes = require('../constants/errorCodes');

router.post("/login", async function (req, res, next) {
    const payload = req.body;
    const head = req.headers;
    let sourceAddress = req.headers["x-forwarded-for"]
        ? req.headers["x-forwarded-for"].split(",").shift()
        : req.socket.remoteAddress;
    sourceAddress = sourceAddress.toString().replace("::ffff:", "");

    if (!payload.username && !payload.password) {
        return next(new AppError(`Empty payload sent`, 400, errorCodes.EMPTY_PAYLOAD));
    }

    if (!payload.username) {
        return next(new AppError(`Username is not present`, 400, errorCodes.MISSING_USERNAME));
    }

    if (!payload.password) {
        return next(new AppError(`Password is not present`, 400, errorCodes.MISSING_PASSWORD));
    }

    try {
        const users = await database.get(tables.USER_TABLE, {
            username: payload.username,
        });
        if (!users || !users.rows || users.rows.length === 0) {
            return next(new AppError(`Invalid username`, 401, errorCodes.INVALID_USERNAME));
        }

        const userData = users.rows[0];
        if (!userData.emailVerified) {
            return next(
                new AppError(
                    `Verification email sent to your email id. Please verify first before trying to login.`,
                    401,
                    errorCodes.EMAIL_NOT_VERIFIED
                )
            );
        }

        const correctPassword = await bcrypt.compare(
            payload.password,
            userData.password
        );
        if (!correctPassword) {
            return next(new AppError(`Invalid password`, 401, errorCodes.INVALID_PASSWORD));
        }

        const userMappings = await database.get(
            tables.USER_CITYUSER_MAPPING_TABLE,
            { userId: userData.id },
            "cityId, cityUserId"
        );
        const tokens = tokenUtil.generator({
            userId: userData.id,
            roleId: userData.roleId,
            rememberMe: payload.rememberMe,
        });

        let refreshData = await database.get(tables.REFRESH_TOKENS_TABLE, {
            userId: userData.id,
        });
        if (refreshData.rows.length > 0) {
            refreshData = refreshData.rows[0];
            if (
                refreshData.sourceAddress === sourceAddress &&
                refreshData.browser === head.browsername &&
                refreshData.device === head.devicetype
            ) {
                await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
                    userId: userData.id,
                });
            }
        }
        const insertionData = {
            userId: userData.id,
            sourceAddress,
            refreshToken: tokens.refreshToken,
            browser: head.browsername,
            device: head.devicetype,
        };

        await database.create(tables.REFRESH_TOKENS_TABLE, insertionData);
        return res.status(200).json({
            status: "success",
            data: {
                cityUsers: userMappings.rows,
                userId: userData.id,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
});

router.post("/register", async function (req, res, next) {
    const payload = req.body;
    const insertionData = {};
    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }
    const language = payload.language || "de";
    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }
    if (!payload.username) {
        return next(new AppError(`Username is not present`, 400));
    } else {
        try {
            const response = await database.get(tables.USER_TABLE, {
                username: payload.username,
            });
            const data = response.rows;
            if (data && data.length > 0) {
                return next(
                    new AppError(
                        `User with username '${payload.username}' already exists`,
                        400
                    )
                );
            }
            if(/\s/.test(payload.username)  || /^_/.test(payload.username) || /^[^a-z_]/.test(payload.username)) {
                return next(
                    new AppError(
                        `Username '${payload.username}' is not valid`,
                        400
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.username = payload.username;
    }
    if (!payload.email) {
        return next(new AppError(`Email is not present`, 400));
    } else {
        try {
            const response = await database.get(tables.USER_TABLE, {
                email: payload.email,
            });
            const data = response.rows;
            if (data && data.length > 0) {
                return next(
                    new AppError(
                        `User with email '${payload.email}' is already registered`,
                        400
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.email = payload.email;
    }

    insertionData.roleId = roles["Content Creator"];

    if (!payload.firstname) {
        return next(new AppError(`Firstname is not present`, 400));
    } else {
        insertionData.firstname = payload.firstname;
    }

    if (!payload.lastname) {
        return next(new AppError(`Lastname is not present`, 400));
    } else {
        insertionData.lastname = payload.lastname;
    }

    if (!payload.password) {
        return next(new AppError(`Password is not present`, 400));
    } else {
        const re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if(!re.test(payload.password)){
            return next(new AppError(`Invalid Password. `, 400));
        } else {
            insertionData.password = await bcrypt.hash(
                payload.password,
                Number(process.env.SALT)
            );
        }
        
    }

    if (payload.email) {
        insertionData.email = payload.email;
    }

    if (payload.phoneNumber) {
        const re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (!re.test(payload.phoneNumber))
            return next(new AppError("Phone number is not valid"));
        insertionData.website = payload.website;
    }

    if (payload.image) {
        insertionData.website = payload.website;
    }

    if (payload.description) {
        insertionData.description = payload.description;
    }

    if (payload.website) {
        insertionData.website = payload.website;
    }
    if (payload.socialMedia) {
        try {
            const socialMediaList = payload.socialMedia;
            Object.keys(socialMediaList).forEach((socialMedia) => {
                if (!supportedSocialMedia.includes(socialMedia)) {
                    return next(
                        new AppError(
                            `Unsupported social media '${socialMedia}'`,
                            400
                        )
                    );
                }

                if (
                    typeof socialMediaList[socialMedia] !== "string" ||
                    !socialMediaList[socialMedia].includes(
                        socialMedia.toLowerCase()
                    )
                ) {
                    return next(
                        new AppError(
                            `Invalid input given for social media '${socialMedia}' `,
                            400
                        )
                    );
                }
            });
            insertionData.socialMedia = JSON.stringify(socialMediaList);
        } catch (e) {
            return next(
                new AppError(`Invalid input given for social media`, 400)
            );
        }
    }

    try {
        const response = await database.create(
            tables.USER_TABLE,
            insertionData
        );
        const userId = response.id;
        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId,
            token,
            expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
        };
        await database.create(tables.VERIFICATION_TOKENS_TABLE, tokenData);
        const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            insertionData.firstname,
            insertionData.lastname,
            token,
            userId,
            language
        );
        await sendMail(insertionData.email, subject, null, body);

        return res.status(200).json({
            status: "success",
            id: userId,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.get("/:id", async function (req, res, next) {
    let userId = req.params.id;
    const cityUser = req.query.cityUser || false;
    const cityId = req.query.cityId;
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid UserId ${userId}`, 404));
        return;
    }

    if (cityUser) {
        if (!cityId) {
            return next(new AppError(`City id not given`, 400));
        }
        try {
            const { rows } = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (!rows || rows.length === 0) {
                return next(
                    new AppError(`City with id ${cityId} does not exist`, 400)
                );
            }

            const cityUsers = await database.get(
                tables.USER_CITYUSER_MAPPING_TABLE,
                {
                    cityId,
                    cityUserId: userId,
                }
            );
            if (!cityUsers.rows || cityUsers.rows.length === 0) {
                return next(
                    new AppError(
                        `User ${userId} is not found in city ${cityId}`,
                        404
                    )
                );
            }
            userId = cityUsers.rows[0].userId;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(tables.USER_TABLE, { id: userId }, [
            "id",
            "username",
            "socialMedia",
            "email",
            "website",
            "description",
            "image",
            "firstname",
            "lastname",
            "roleId",
        ])
        .then((response) => {
            const data = response.rows;
            if (!data || data.length === 0) {
                return next(
                    new AppError(`User with id ${userId} does not exist`, 404)
                );
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

router.patch("/:id", authentication, async function (req, res, next) {
    const id = Number(req.params.id);
    const payload = req.body;
    const updationData = {};

    if (isNaN(id) || id <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    if (id !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    const response = await database.get(tables.USER_TABLE, { id });
    if (!response.rows || response.rows.length === 0) {
        return next(new AppError(`User with id ${id} does not exist`, 404));
    }

    const currentUserData = response.rows[0];
    if (payload.username && payload.username !== currentUserData.username) {
        return next(new AppError(`Username cannot be edited`, 400));
    }

    if (payload.email && payload.email !== currentUserData.email) {
        const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(payload.email)) {
            return next(new AppError(`Invalid email given`, 400));
        }
        updationData.email = payload.email;
    }

    if (payload.firstname) {
        updationData.firstname = payload.firstname;
    }

    if (payload.newPassword) {
        if (!payload.currentPassword) {
            return next(
                new AppError(
                    `Current password not given to update password`,
                    400
                )
            );
        }
        if (
            !bcrypt.compare(payload.currentPassword, currentUserData.password)
        ) {
            return next(new AppError(`Incorrect current password given`, 401));
        }
        const passwordCheck = await bcrypt.compare(
            payload.newPassword,
            currentUserData.password
        );
        if(passwordCheck){
            return next(new AppError(`New password should not be same as the old password`, 400));
        }
        updationData.password = await bcrypt.hash(
            payload.newPassword,
            Number(process.env.SALT)
        );
    }

    if (payload.lastname) {
        updationData.lastname = payload.lastname;
    }

    if (payload.phoneNumber) {
        const re = /^\+49\d{11}$/;
        if (!re.test(payload.phoneNumber))
            return next(new AppError("Phone number is not valid", 400));
        updationData.phoneNumber = payload.phoneNumber;
    }

    if (payload.description) {
        updationData.description = payload.description;
    }

    if (payload.website) {
        updationData.website = payload.website;
    }

    if (payload.image || payload.image === "") {
        updationData.image = payload.image;
    }

    if (payload.description) {
        updationData.description = payload.description;
    }

    if (payload.website) {
        updationData.website = payload.website;
    }
    if (payload.socialMedia) {
        const socialMediaList = JSON.parse(payload.socialMedia);
        socialMediaList.forEach((socialMedia) => {
            if (!supportedSocialMedia.includes(Object.keys(socialMedia)[0])) {
                return next(
                    new AppError(
                        `Unsupported social media '${socialMedia}'`,
                        400
                    )
                );
            }

            if (
                typeof socialMedia[Object.keys(socialMedia)[0]] !== "string" ||
                !socialMedia[Object.keys(socialMedia)[0]].includes(
                    Object.values(socialMedia)[0].toLowerCase()
                )
            ) {
                return next(
                    new AppError(
                        `Invalid input given for social '${socialMedia}' `,
                        400
                    )
                );
            }
        });
        updationData.socialMedia = JSON.stringify(socialMediaList);
    }

    if (Object.keys(updationData).length > 0) {
        database
            .update(tables.USER_TABLE, updationData, { id })
            .then((response) => {
                res.status(200).json({
                    status: "success",
                });
            })
            .catch((err) => {
                return next(new AppError(err));
            });
    } else {
        return res.status(200).json({
            status: "success",
        });
    }
});

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

router.delete(
    "/:id/imageDelete",
    authentication,
    async function (req, res, next) {
        const id = req.params.id;

        if (isNaN(Number(id)) || Number(id) <= 0) {
            next(new AppError(`Invalid UserId ${id}`, 404));
            return;
        }

        try {
            if (parseInt(id) !== parseInt(req.userId)) {
                return next(
                    new AppError(
                        `You are not allowed to access this resource`,
                        403
                    )
                );
            }
            const onSucccess = async () => {
                const updationData = {};
                updationData.image = "";

                await database.update(tables.USER_TABLE, updationData, { id });
                return res.status(200).json({
                    status: "success",
                });
            };
            const onFail = (err) => {
                return next(
                    new AppError("Image Delete failed with Error Code: " + err)
                );
            };
            await objectDelete(`user_${id}/profilePic`, onSucccess, onFail);
        } catch (err) {
            return next(new AppError(err));
        }
    }
);

router.post(
    "/:id/imageUpload",
    authentication,
    async function (req, res, next) {
        const id = parseInt(req.params.id);

        if (isNaN(Number(id)) || Number(id) <= 0) {
            next(new AppError(`Invalid UserId ${id}`, 404));
            return;
        }
        const { image } = req.files;

        if (!image) {
            next(new AppError(`Image not uploaded`, 400));
            return;
        }

        try {
            if (id !== parseInt(req.userId)) {
                return next(
                    new AppError(
                        `You are not allowed to access this resource`,
                        403
                    )
                );
            }

            const { uploadStatus } = await imageUpload(
                image,
                `user_${id}/profilePic`
            );
            if (uploadStatus === "Success") {
                const updationData = {};
                updationData.image = `user_${id}/profilePic`;
                database
                    .update(tables.USER_TABLE, updationData, { id })
                    .then((response) => {})
                    .catch((err) => {
                        return next(new AppError(err));
                    });

                return res.status(200).json({
                    status: "success",
                    data:{
                        image:updationData.image
                    }
                });
            } else {
                return res.status(500).json({
                    status: "Failed!! Please try again",
                });
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }
);

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
                if (req.query.subCategoryId) {
                    try {
                        const response = database.get(
                            tables.SUBCATEGORIES_TABLE,
                            {
                                categoryId: req.query.categoryId,
                                subCategoryId: req.query.subCategoryId,
                            }
                        );
                        const data = response.rows;
                        if (data && data.length === 0) {
                            return next(
                                new AppError(
                                    `Invalid subCategory '${req.query.subCategoryId}' given`,
                                    400
                                )
                            );
                        }
                    } catch (err) {
                        return next(new AppError(err));
                    }
                    filters.subCategoryId = req.query.subCategoryId;
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
            let query = `SELECT *, ${
                cityMapping.cityId
            } as cityId FROM heidi_city_${cityMapping.cityId}${
                cityMapping.inCityServer ? "_" : "."
            }listings WHERE userId = ${cityMapping.cityUserId}`;
            if (filters.categoryId || filters.statusId) {
                if (filters.categoryId) {
                    query += ` AND categoryId = ${filters.categoryId}`;
                }
                if (filters.subCategoryId) {
                    query += ` AND subCategoryId = ${filters.subCategoryId}`;
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

router.post("/:id/refresh", async function (req, res, next) {
    const userId = req.params.id;
    const sourceAddress = req.headers["x-forwarded-for"]
        ? req.headers["x-forwarded-for"].split(",").shift()
        : req.socket.remoteAddress;

    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid UserId ${userId}`, 404));
        return;
    }

    try {
        const refreshToken = req.body.refreshToken;
        if (!refreshToken) {
            return next(new AppError(`Refresh token not present`, 400));
        }

        const decodedToken = tokenUtil.verify(
            refreshToken,
            process.env.REFRESH_PUBLIC,
            next
        );
        if (decodedToken.userId !== parseInt(userId)) {
            return next(new AppError(`Invalid refresh token`, 403));
        }

        const response = await database.get(tables.REFRESH_TOKENS_TABLE, {
            refreshToken,
        });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Invalid refresh token`, 400));
        }

        if (data[0].userId !== parseInt(userId)) {
            return next(new AppError(`Invalid refresh token`, 400));
        }
        const newTokens = tokenUtil.generator({
            userId: decodedToken.userId,
            roleId: decodedToken.roleId,
        });
        const insertionData = {
            userId,
            sourceAddress,
            refreshToken: newTokens.refreshToken,
        };
        await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
            id: data[0].id,
        });
        await database.create(tables.REFRESH_TOKENS_TABLE, insertionData);

        return res.status(200).json({
            status: "success",
            data: {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            },
        });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
                refreshToken: req.body.refreshToken,
            });
            return next(new AppError(`Unauthorized! Token was expired!`, 401));
        }
        return next(new AppError(error));
    }
});

router.post("/forgotPassword", async function (req, res, next) {
    const username = req.body.username;
    const language = req.body.language || "de";

    if (!username) {
        return next(new AppError(`Username not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    try {
        let response = await database.get(tables.USER_TABLE, { username });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(
                new AppError(`Username ${username} does not exist`, 404)
            );
        }
        const user = data[0];

        response = await database.deleteData(
            tables.FORGOT_PASSWORD_TOKENS_TABLE,
            { userId: user.id }
        );

        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
        };
        response = await database.create(
            tables.FORGOT_PASSWORD_TOKENS_TABLE,
            tokenData
        );

        const resetPasswordEmail = require(`../emailTemplates/${language}/resetPasswordEmail`);
        const { subject, body } = resetPasswordEmail(
            user.firstname,
            user.lastname,
            token,
            user.id
        );
        await sendMail(user.email, subject, null, body);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/resetPassword", async function (req, res, next) {
    const userId = req.body.userId;
    const language = req.body.language || "de";
    const token = req.body.token;
    const password = req.body.password;

    if (!userId) {
        return next(new AppError(`Username not present`, 400));
    }

    if (!token) {
        return next(new AppError(`Token not present`, 400));
    }

    if (!password) {
        return next(new AppError(`Password not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    try {
        let response = await database.get(tables.USER_TABLE, { id: userId });
        let data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`UserId ${userId} does not exist`, 400));
        }
        const user = data[0];

        const passwordCheck = await bcrypt.compare(
            password,
            user.password
        );
        if(passwordCheck){
            return next(new AppError(`New password should not be same as the old password`, 400, errorCodes.NEW_OLD_PASSWORD_DIFFERENT));
        }
        response = await database.get(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
            userId,
            token,
        });
        data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Invalid data sent`, 400));
        }
        const tokenData = data[0];
        await database.deleteData(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
            userId,
            token,
        });
        if (tokenData.expiresAt < new Date().toISOString()) {
            return next(new AppError(`Token Expired`, 400));
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(process.env.SALT)
        );
        await database.update(
            tables.USER_TABLE,
            { password: hashedPassword },
            { id: userId }
        );

        const passwordResetDone = require(`../emailTemplates/${language}/passwordResetDone`);
        const { subject, body } = passwordResetDone(
            user.firstname,
            user.lastname
        );
        await sendMail(user.email, subject, null, body);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/sendVerificationEmail", async function (req, res, next) {
    const email = req.body.email;
    const language = req.body.language || "de";

    if (!email) {
        return next(new AppError(`Email not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    try {
        const response = await database.get(tables.USER_TABLE, { email });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Email ${email} does not exist`, 400));
        }
        const user = data[0];
        if (user.emailVerified) {
            return next(new AppError(`Email already verified`, 400));
        }

        await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
            userId: user.id,
        });

        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
        };
        await database.create(tables.VERIFICATION_TOKENS_TABLE, tokenData);
        const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            user.firstname,
            user.lastname,
            token,
            user.id,
            language
        );
        await sendMail(user.email, subject, null, body);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/verifyEmail", async function (req, res, next) {
    const userId = req.body.userId;
    const language = req.body.language || "de";
    const token = req.body.token;

    if (!userId) {
        return next(new AppError(`Username not present`, 400));
    }

    if (!token) {
        return next(new AppError(`Token not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    try {
        let response = await database.get(tables.USER_TABLE, { id: userId });
        let data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`UserId ${userId} does not exist`, 400));
        }
        const user = data[0];
        if (user.emailVerified) {
            return res.status(200).json({
                status: "success",
                message: "Email has already been vefified!!",
            });
        }

        response = await database.get(tables.VERIFICATION_TOKENS_TABLE, {
            userId,
            token,
        });
        data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Invalid data sent`, 400));
        }
        const tokenData = data[0];
        await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
            userId,
            token,
        });
        if (tokenData.expiresAt < new Date().toISOString()) {
            return next(
                new AppError(`Token Expired, send verification mail again`, 400)
            );
        }

        await database.update(
            tables.USER_TABLE,
            { emailVerified: true },
            { id: userId }
        );

        const verificationDone = require(`../emailTemplates/${language}/verificationDone`);
        const { subject, body } = verificationDone(
            user.firstname,
            user.lastname
        );
        await sendMail(user.email, subject, null, body);
        return res.status(200).json({
            status: "success",
            message: "The Email Verification was successfull!",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.post("/:id/logout", authentication, async function (req, res, next) {
    const userId = parseInt(req.params.id);

    if (userId !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    if (!req.body.refreshToken) {
        return next(new AppError(`Refresh Token not sent`, 403));
    }
    database
        .get(tables.REFRESH_TOKENS_TABLE, {
            refreshToken: req.body.refreshToken,
        })
        .then(async (response) => {
            const data = response.rows;
            if (!data || data.length === 0) {
                return next(
                    new AppError(
                        `User with id ${req.body.refreshToken} does not exist`,
                        404
                    )
                );
            }
            await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
                userId,
                refreshToken: req.body.refreshToken,
            });
            res.status(200).json({
                status: "success",
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.get("/", async function (req, res, next) {
    const params = req.query;
    const columsToQuery = [
        "id",
        "username",
        "socialMedia",
        "email",
        "website",
        "image",
        "firstname",
        "description",
        "lastname",
        "description",
        "roleId",
    ];
    const filter = {}
    if (params.ids) {
        const ids = params.ids.split(",").map((id) => parseInt(id))
        if (ids && ids.length > 10) {
            throw new AppError("You can only fetch upto 10 users");
        }
        filter.id = ids;
    }
    if (params.username) {
        filter.username = params.username;
    }
    if (!filter) {
        throw new new AppError("You need to send some params to filter")
    }
    database
        .get(tables.USER_TABLE, filter, columsToQuery)
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

router.post(
    "/:id/loginDevices",
    authentication,
    async function (req, res, next) {
        const userId = parseInt(req.params.id);
        const refreshToken = req.body.refreshToken;
        if (userId !== req.userId) {
            return next(
                new AppError("You are not allowed to access this resource")
            );
        }
        database
            .callQuery(
                `select id, userId, sourceAddress, browser, device from refreshtokens where userId = ? and refreshToken NOT IN (?); `,
                [userId, refreshToken]
            )
            .then((response) => {
                const data = response.rows;
                res.status(200).json({
                    status: "success",
                    data,
                });
            })
            .catch((err) => {
                return next(new AppError(err));
            });
    }
);

router.delete(
    "/:id/loginDevices",
    authentication,
    async function (req, res, next) {
        const userId = parseInt(req.params.id);
        const id = req.query.id;
        if (!id) {
            database
                .deleteData(tables.REFRESH_TOKENS_TABLE, { userId })
                .then(() => {
                    res.status(200).json({
                        status: "success",
                    });
                })
                .catch((err) => {
                    return next(new AppError(err));
                });
        } else {
            database
                .deleteData(tables.REFRESH_TOKENS_TABLE, { userId, id })
                .then(() => {
                    res.status(200).json({
                        status: "success",
                    });
                })
                .catch((err) => {
                    return next(new AppError(err));
                });
        }
    }
);

module.exports = router;
