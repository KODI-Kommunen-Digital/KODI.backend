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
const errorCodes = require('../constants/errorCodes');
const getDateInFormate = require("../utils/getDateInFormate");
const { register, login } = require("../controllers/userController");

/**
 * @swagger
 * /users/login:
 *  post:
 *    summary: Login a user
 *    description: Login a user
 *    tags: [login]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: true
 *            properties:
 *              username:
 *                type: string
 *                example: johndoe
 *                description: The username of the user
 *              password:
 *                type: string
 *                example: MyPassword123
 *                description: The password of the user
 *    responses:
 *      200:
 *        description: The user was successfully logged in
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: success
 *                data:
 *                  type: object
 *                  properties:
 *                    accessToken:
 *                      type: string
 *                      example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJyb2xlSWQiOjMsImlhdCI6MTcwMDgzNDEyMywiZXhwIjoxNzAwODM0NzIzfQ.2YbrSDSRbqK4YQYhbvD1oZZxeso7ybc-5EagOTqx0VBWyoLGvtFlbJmTq_NRwmbeYesm9o5irhK-sPPEWyB9_htQA_YrSYfhwhbeDFeGwFsTY6Hl4KRtWdZMgbS4AnnClSkq79eJylFblgwbI1UfXwcVJqDc5hi2z-s60gIW4Wq5itkEY-aIgVqdrY8gsf-SQokQ4DgqqYUywDYRV6X0gL3KAB7eEJDZH2xdkmmWKLQdsY6I86rMd5Sm_W5eP4epntL8uxEEi3ALAEEsOnoBXbwXNElJekrbWWrRUcW7rfDVKRbeD-opzMs975EHJjkcMBmqx8JesC2dvXIBimO9PA
 *                      description: The access token of the user
 *                    refreshToken:
 *                      type: string
 *                      example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJyb2xlSWQiOjMsImlhdCI6MTcwMDgzNDEyMywiZXhwIjoxNzAxMjY2MTIzfQ.FydosENe_XoBkToCdhqKbkdYuT3LFoFfoQgnk_s-tWJfii0yVPqxwwIa-hs0C0Ea4HhPptCI0v9POW5h_h5poX_Bkt_yVsr3ZShy8Y9uUarBHF8QCDRqMwgQodBVDorOnCO4Aa_CgHSNqj4PUoi8Dw15GrXvgpU8jj_gSf0_z4FeD3EvcBXWBrUYhTt-QdCKCpdx4vXjNgFJzyCncaYouuoUn9oKu4qsE2ScY4zaYzAsK-p9pzr95Wt3qTuze64sO2IsLJVuLMHDnP7IywcjHxUYDONkDX55pGctef7b8jEv3Ru4h7oUdjaAqasup3y0A7_PhxqWIU2zfn6Wda0zbA
 *                      description: The refresh token of the user
 *                    userId:
 *                      type: integer
 *                      example: 19
 *                    cityUsers:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          cityId:
 *                            type: integer
 *                            example: 1
 *                            description: The id of the city
 *                          cityUserId:  
 *                            type: integer
 *                            example: 1
 *                            description: The id of the user in the city 
 *      400:
 *        description: Invalid input given 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: error
 *                errorCode:
 *                  type: integer
 *                  example: 2003
 *                  description: The error code
 *                message:
 *                  type: string
 *                  example: Invalid username or email
 *                  description: The error message
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: error
 *                message:
 *                  type: string
 *                  example: ReferenceError getUser is not defined
 *                  description: The error message
 */
router.post("/login", login);

/**
 * @swagger
 * /users/register:
 *  post:
 *    summary: Register a new user
 *    description: Register a new user
 *    tags: [register]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              required: true
 *              $ref: '#/components/schemas/User'
 *    responses:
 *      200:
 *        description: The user was successfully registered
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: success
 *                id:
 *                  type: integer
 *                  example: 1
 *                  description: The id of the newly registered user
 *      400:
 *        description: Invalid input given
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: error
 *                message:
 *                  type: string
 *                  example: User with username 'johndoe' already exists
 *                  description: The error message
 *                errorCode:
 *                  type: integer
 *                  example: 2005
 *                  description: The error code
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: error
 *                message:
 *                  type: string
 */

router.post("/register", register);

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
        if (payload.description.length > 255) {
            return next(
                new AppError(
                    `Length of Description cannot exceed 255 characters`,
                    400
                )
            );
        }
            
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
            let query = `SELECT *, ${
                cityMapping.cityId
            } as cityId FROM heidi_city_${cityMapping.cityId}${
                cityMapping.inCityServer ? "_" : "."
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
        let response = await database.get(tables.USER_TABLE, {
            username: req.body.username,
            email: req.body.username
        }, null, null, null, null, null, null, "OR");

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
            expiresAt: getDateInFormate(now),
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
        if (tokenData.expiresAt < new Date().toLocaleString()) {
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
            expiresAt: getDateInFormate(now),
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
        if (tokenData.expiresAt < new Date().toLocaleString()) {
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
