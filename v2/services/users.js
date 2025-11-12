const bcrypt = require("bcrypt");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const roles = require("../constants/roles");
const sendMail = require("../utils/sendMail");
const getDateInFormate = require("../utils/getDateInFormate");
const supportedSocialMedia = require("../constants/supportedSocialMedia");
const imageUpload = require("../utils/imageUpload");
const objectDelete = require("../utils/imageDelete");
const tokenUtil = require("../utils/token");
const { getUserImages } = require("../repository/image");
const imageDeleteAsync = require("../utils/imageDeleteAsync");

const usersRepository = require("../repository/userRepo");
const tokenRepository = require("../repository/tokenRepo");
const userCityUserMappingRepository = require("../repository/cityUserMappingRepo");
const verificationTokenRepository = require("../repository/verificationTokensRepo");
const forgotPasswordTokenRepository = require("../repository/forgotPasswordTokensRepo");
const statusRepository = require("../repository/statusRepo");
const listingRepository = require("../repository/listingsRepo");
const categoryRepository = require("../repository/categoriesRepo");
const subCategoryRepository = require("../repository/subcategoriesRepo");
const firebaseTokenRepository = require("../repository/firebaseTokenRepo");
const adminRepository = require("../repository/adminRepo");
const cityUserRolesRepository = require("../repository/cityUserRolesRepo");
const moderatorsRepository = require("../repository/moderatorsRepo");
const moderatorPermissionsRepository = require("../repository/moderatorPermissionsRepo");
const permissionsRepository = require("../repository/permissionsRepo");

const login = async function (
    payload,
    sourceAddress,
    browsername,
    devicetype,
    req
) {
    try {
        const userData = await usersRepository.getOne({
            filters: [
                {
                    key: "username",
                    sign: "=",
                    value: payload.username,
                },
                {
                    key: "email",
                    sign: "=",
                    value: payload.username,
                },
                {
                    key: "blocked",
                    sign: "=",
                    value: 0,
                },
            ],
            joinFiltersBy: "OR",
            columns: [
                "id",
                "username",
                "email",
                "password",
                "emailVerified",
                "roleId",
            ],
        });
        if (!userData) {
            throw new AppError(
                "invalid_creds",
                401,
                errorCodes.INVALID_CREDENTIALS
            );
        }

        if (!userData.emailVerified) {
            throw new AppError(
                "verify_email",
                401,
                errorCodes.EMAIL_NOT_VERIFIED
            );
        }

        const correctPassword = await bcrypt.compare(
            payload.password,
            userData.password
        );
        if (!correctPassword) {
            throw new AppError(
                "invalid_password",
                401,
                errorCodes.INVALID_PASSWORD
            );
        }

        // const userMappings = await userRepo.getuserCityMappings(userData.id);
        let userMappings = [];
        const userMappingsResp = await userCityUserMappingRepository.getAll({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userData.id,
                },
            ],
            columns: ["cityId", "cityUserId"],
        });
        if (
            !userMappingsResp ||
            !userMappingsResp.rows ||
            userMappingsResp.rows.length === 0
        ) {
            userMappings = [];
        } else {
            userMappings = userMappings.rows;
        }

        const tokens = tokenUtil.generator({
            userId: userData.id,
            roleId: userData.roleId,
            rememberMe: payload.rememberMe,
        });

        const refreshToken = await tokenRepository.getOne({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userData.id,
                },
            ],
        });
        if (
            refreshToken &&
            refreshToken.sourceAddress === sourceAddress &&
            (refreshToken.browser === browsername ||
                (!refreshToken.browser && !browsername)) &&
            (refreshToken.device === devicetype ||
                (!refreshToken.device && !devicetype))
        ) {
            tokenRepository.delete({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: refreshToken.id,
                    },
                ],
            });
        }
        const insertionData = {
            userId: userData.id,
            sourceAddress,
            refreshToken: tokens.refreshToken,
            browser: browsername,
            device: devicetype,
        };

        await tokenRepository.create({
            data: insertionData,
        });
        return {
            cityUsers: userMappings ?? [],
            userId: userData.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err, 500);
    }
};

const register = async function (payload, req) {
    const insertionData = {};
    if (!payload) {
        throw new AppError("empty_payload_sent", 400, errorCodes.EMPTY_PAYLOAD);
    }
    const language = payload.language || "de";
    if (language !== "en" && language !== "de") {
        throw new AppError(
            `Incorrect language given`,
            400,
            errorCodes.INVALID_LANGUAGE
        );
    }

    if (!payload.username) {
        throw new AppError(
            "username_not_present",
            400,
            errorCodes.MISSING_USERNAME
        );
    } else {
        if (payload.username.length > 40) {
            throw new AppError(
                "username_too_long",
                400,
                errorCodes.INVALID_USERNAME
            );
        }
        try {
            // const user = await userRepo.getUserWithUsername(payload.username);
            const user = await usersRepository.getOne({
                filters: [
                    {
                        key: "username",
                        sign: "=",
                        value: payload.username,
                    },
                ],
            });
            if (user) {
                throw new AppError(
                    "username_already_exits",
                    400,
                    errorCodes.USER_ALREADY_EXISTS,
                    { username: payload.username }
                );
            }

            if (
                /\s/.test(payload.username) ||
                /^_/.test(payload.username) ||
                /^[^a-z_]/.test(payload.username)
            ) {
                throw new AppError(
                    "invalid_username",
                    400,
                    errorCodes.INVALID_USERNAME,
                    { username: payload.username }
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        insertionData.username = payload.username;
    }

    if (!payload.email) {
        throw new AppError("email_not_present", 400, errorCodes.MISSING_EMAIL);
    } else {
        try {
            // const user = await userRepo.getUserWithEmail(payload.email);
            const user = await usersRepository.getOne({
                filters: [
                    {
                        key: "email",
                        sign: "=",
                        value: payload.email,
                    },
                ],
            });
            if (user) {
                throw new AppError(
                    "email_already_registered",
                    400,
                    errorCodes.EMAIL_ALREADY_EXISTS,
                    { email: payload.email }
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        insertionData.email = payload.email;
    }

    insertionData.roleId = roles["Content Creator"];

    if (!payload.firstname) {
        throw new AppError(
            "first_name_missing",
            400,
            errorCodes.MISSING_FIRSTNAME
        );
    } else {
        if (payload.firstname.length > 40) {
            throw new AppError(
                "first_name_too_long",
                400,
                errorCodes.INVALID_CREDENTIALS
            );
        }
        insertionData.firstname = payload.firstname;
    }

    if (!payload.lastname) {
        throw new AppError(
            "last_name_missing",
            400,
            errorCodes.MISSING_LASTNAME
        );
    } else {
        if (payload.lastname.length > 40) {
            throw new AppError(
                "last_name_too_long",
                400,
                errorCodes.INVALID_CREDENTIALS
            );
        }
        insertionData.lastname = payload.lastname;
    }

    if (!payload.password) {
        throw new AppError(
            "missing_password",
            400,
            errorCodes.MISSING_PASSWORD
        );
    } else {
        if (payload.password.length > 64) {
            throw new AppError(
                "password_too_long",
                400,
                errorCodes.INVALID_PASSWORD
            );
        }
        const re = /^\S{8,}$/;
        if (!re.test(payload.password)) {
            throw new AppError(
                "invalid_password",
                400,
                errorCodes.INVALID_PASSWORD
            );
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
        if (!re.test(payload.phoneNumber)) throw new AppError("invalid_phone");
        insertionData.website = payload.website;
    }

    if (payload.description) {
        if (payload.description.length > 255) {
            throw new AppError("description_too_long", 400);
        }
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
                    throw new AppError(
                        "unsupported_social_media",
                        400,
                        undefined,
                        { socialMedia }
                    );
                }

                if (
                    typeof socialMediaList[socialMedia] !== "string" ||
                    !socialMediaList[socialMedia].includes(
                        socialMedia.toLowerCase()
                    )
                ) {
                    throw new AppError("invalid_social_input", 400, undefined, {
                        socialMedia,
                    });
                }
            });
            insertionData.socialMedia = JSON.stringify(socialMediaList);
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError("invalid_social_input", 400, undefined, {
                socialMedia: payload.socialMedia,
            });
        }
    }
    let cities;
    // const connection = await database.createTransaction();
    const connection = await usersRepository.createTransaction();
    try {
        try {
            const AdminUser = await adminRepository.getOne({
                filters: [
                    {
                        key: "email",
                        sign: "=",
                        value: insertionData.email,
                    },
                ],
            });
            if (AdminUser) {
                cities = AdminUser.cities;
                await adminRepository.updateWithTransaction(
                    {
                        data: {
                            onBoarded: 1,
                        },
                        filters: [
                            {
                                key: "email",
                                sign: "=",
                                value: insertionData.email,
                            },
                        ],
                    },
                    connection
                );
                insertionData.roleId = AdminUser.roleId;
            }
        } catch (err) {}
        // const response = await userRepo.createUser(insertionData, connection);
        const response = await usersRepository.createWithTransaction(
            {
                data: insertionData,
            },
            connection
        );
        const userId = response.id;
        if (cities && cities.length !== 0) {
            await Promise.all(
                cities.map(async (cityId) => {
                    await cityUserRolesRepository.createWithTransaction(
                        {
                            data: {
                                userId,
                                cityId,
                                isAdmin: true,
                            },
                        },
                        connection
                    );
                })
            );
        }

        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: response.id,
            token,
            expiresAt: getDateInFormate(now),
        };
        await verificationTokenRepository.createWithTransaction(
            {
                data: tokenData,
            },
            connection
        );

        // const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const verifyEmail = require(`../../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            insertionData.firstname,
            insertionData.lastname,
            token,
            userId,
            language
        );
        await sendMail(insertionData.email, subject, null, body);

        // database.commitTransaction(connection);
        await usersRepository.commitTransaction(connection);

        return userId;
    } catch (err) {
        await usersRepository.rollbackTransaction(connection);
        if (err instanceof AppError) throw err;
        // database.rollbackTransaction(connection);
        throw new AppError(err);
    }
};

const getUserById = async function (userId, cityUser, cityId, reqUserId) {
    try {
        // const userData = await userRepo.getUserWithId(userId);
        const userData = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
            columns:
                "id, username, socialMedia, email, website, description, image, phoneNumber, firstname, lastname, roleId",
        });
        if (!userData) {
            throw new AppError(`user_id_does_not_exist`, 404, undefined, {
                id: userId,
            });
        }

        if (reqUserId !== userId) {
            // Obfuscate all fields except 'id', 'username', and 'image'
            userData.email = "***@***.**";
            userData.socialMedia = "hidden";
            userData.website = "hidden";
            userData.description = "hidden";
            userData.phoneNumber = "hidden";
            userData.firstname = "hidden";
            userData.lastname = "hidden";
        }

        return userData;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const updateUser = async function (id, payload, req) {
    const updationData = {};

    const currentUserData = await usersRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: id,
            },
        ],
    });
    if (!currentUserData) {
        throw new AppError("user_id_does_not_exist", 404, undefined, { id });
    }

    if (payload.username && payload.username !== currentUserData.username) {
        throw new AppError("username_not_editable", 400);
    }

    if (payload.email && payload.email !== currentUserData.email) {
        const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(payload.email)) {
            throw new AppError("invalid_email", 400);
        }
        updationData.email = payload.email;
    }

    if (payload.firstname) {
        updationData.firstname = payload.firstname;
    }

    if (payload.newPassword) {
        if (!payload.currentPassword) {
            throw new AppError("current_password_missing", 400);
        }
        const currentPasswordCorrect = await bcrypt.compare(
            payload.currentPassword,
            currentUserData.password
        );
        if (!currentPasswordCorrect) {
            throw new AppError(
                "current_password_incorrect",
                401,
                errorCodes.INVALID_PASSWORD
            );
        }
        const passwordCheck = await bcrypt.compare(
            payload.newPassword,
            currentUserData.password
        );
        if (passwordCheck) {
            throw new AppError(
                "current_same_not_as_present",
                400,
                errorCodes.SAME_PASSWORD_GIVEN
            );
        }
        updationData.password = await bcrypt.hash(
            payload.newPassword,
            Number(process.env.SALT)
        );
    }

    if (payload.lastname) {
        updationData.lastname = payload.lastname;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "phoneNumber")) {
        const re = /^(\d{8,15})$/;
        if (payload.phoneNumber !== "" && !re.test(payload.phoneNumber)) {
            throw new AppError("invalid_phone", 400);
        }
        // If phoneNumber is an empty string, set it to null
        updationData.phoneNumber =
            payload.phoneNumber === "" ? null : payload.phoneNumber;
    }

    if (payload.description) {
        if (payload.description.length > 255) {
            throw new AppError("description_too_long", 400);
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
                throw new AppError(
                    "nicht_unterstütztes_soziales_medium",
                    400,
                    undefined,
                    { socialMedia }
                );
            }

            if (
                typeof socialMedia[Object.keys(socialMedia)[0]] !== "string" ||
                !socialMedia[Object.keys(socialMedia)[0]].includes(
                    Object.values(socialMedia)[0].toLowerCase()
                )
            ) {
                throw new AppError(
                    "ungültige_eingabe_für_soziale_medien",
                    400,
                    undefined,
                    { socialMedia }
                );
            }
        });
        updationData.socialMedia = JSON.stringify(socialMediaList);
    }

    if (Object.keys(updationData).length > 0) {
        // TODO add transaction
        try {
            // const cityUserResponse = await userRepo.getuserCityMappings(id);
            const cityUserResponse = await userCityUserMappingRepository.getAll(
                {
                    filters: [
                        {
                            key: "userId",
                            sign: "=",
                            value: id,
                        },
                    ],
                    columns: ["cityId", "cityUserId"],
                }
            );
            // await userRepo.updateUserById(id, updationData);
            await usersRepository.update({
                data: updationData,
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: id,
                    },
                ],
            });

            const cityUserUpdationData = { ...updationData, coreuserId: id };
            delete cityUserUpdationData.password;
            delete cityUserUpdationData.socialMedia;

            for (const element of cityUserResponse.rows) {
                // await userRepo.updateCityUserById(
                //     element.cityUserId,
                //     cityUserUpdationData,
                //     element.cityId,
                // );
                await usersRepository.update({
                    data: cityUserUpdationData,
                    cityId: element.cityId,
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: element.cityUserId,
                        },
                    ],
                });
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
};

const refreshAuthToken = async function (userId, sourceAddress, refreshToken) {
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        throw new AppError(`invalid_user_id`, 404, undefined, { id: userId });
    }

    try {
        if (!refreshToken) {
            throw new AppError(`refresh_token_missing`, 400);
        }

        const decodedToken = tokenUtil.verify(
            refreshToken,
            process.env.REFRESH_PUBLIC
        );
        if (decodedToken.userId !== parseInt(userId)) {
            throw new AppError(`invalid_refresh_token`, 403);
        }

        // const refreshTokenData =
        //     await tokenRepo.getRefreshTokenByRefreshToken(refreshToken);
        const refreshTokenData = await tokenRepository.getOne({
            filters: [
                {
                    key: "refreshToken",
                    sign: "=",
                    value: refreshToken,
                },
            ],
        });
        if (!refreshTokenData) {
            throw new AppError(`invalid_refresh_token`, 400);
        }

        if (refreshTokenData.userId !== parseInt(userId)) {
            throw new AppError(`invalid_refresh_token`, 400);
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

        // await tokenRepo.deleteRefreshTokenByTokenUid(refreshTokenData.id);
        await tokenRepository.delete({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: refreshTokenData.id,
                },
            ],
        });

        // await tokenRepo.insertRefreshTokenData(insertionData);
        await tokenRepository.create({
            data: insertionData,
        });

        return {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
        };
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            // await tokenRepo.deleteRefreshTokenByRefreshToken(refreshToken);
            await tokenRepository.delete({
                filters: [
                    {
                        key: "refreshToken",
                        sign: "=",
                        value: refreshToken,
                    },
                ],
            });
            throw new AppError(`expired_refresh_token`, 401);
        }
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const forgotPassword = async function (username, language = "de", req) {
    // const transaction = await database.createTransaction();
    const transaction = await usersRepository.createTransaction();
    try {
        // const user = await userRepo.getUserByUsernameOrEmail(username, username);
        const user = await usersRepository.getOne({
            filters: [
                {
                    key: "username",
                    sign: "=",
                    value: username,
                },
                {
                    key: "email",
                    sign: "=",
                    value: username,
                },
            ],
            joinFiltersBy: "OR",
        });
        if (!user) {
            throw new AppError("user_does_not_exist", 404, undefined, {
                username,
            });
        }

        // await userRepo.deleteForgotTokenForUserWithConnection(user.id, transaction);
        await forgotPasswordTokenRepository.deleteWithTransaction(
            {
                filters: [
                    {
                        key: "userId",
                        sign: "=",
                        value: user.id,
                    },
                ],
            },
            transaction
        );

        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: getDateInFormate(now),
        };

        // await userRepo.addForgotPasswordTokenWithConnection(tokenData, transaction);
        await forgotPasswordTokenRepository.createWithTransaction(
            {
                data: tokenData,
            },
            transaction
        );

        const resetPasswordEmail = require(`../emailTemplates/${language}/resetPasswordEmail`);
        const { subject, body } = resetPasswordEmail(
            user.firstname,
            user.lastname,
            token,
            user.id
        );
        console.log({ subject, body });
        const result = await sendMail(user.email, subject, null, body);
        console.log({ result });
        await usersRepository.commitTransaction(transaction);
    } catch (err) {
        await usersRepository.rollbackTransaction(transaction);
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

// TODO: implement transaction
const resetPassword = async function (userId, language, token, password, req) {
    try {
        // const user = await userRepo.getUserDataById(userId);
        const user = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!user) {
            throw new AppError("user_id_does_not_exist", 400);
        }

        const passwordCheck = await bcrypt.compare(password, user.password);
        if (passwordCheck) {
            throw new AppError(
                "current_same_not_as_present",
                400,
                errorCodes.NEW_OLD_PASSWORD_DIFFERENT
            );
        }
        // const tokenData = await tokenRepo.getForgotPasswordToken(userId, token);
        const tokenData = await forgotPasswordTokenRepository.getOne({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
                {
                    key: "token",
                    sign: "=",
                    value: token,
                },
            ],
        });
        if (!tokenData) {
            throw new AppError("invalid_token", 400);
        }
        // await tokenRepo.deleteForgotPasswordToken(userId, token);
        await forgotPasswordTokenRepository.delete({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
                {
                    key: "token",
                    sign: "=",
                    value: token,
                },
            ],
        });
        if (new Date(tokenData.expiresAt).getTime() < Date.now()) {
            throw new AppError("token_expired", 400);
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(process.env.SALT)
        );

        // await userRepo.updateUserById(userId, { password: hashedPassword });
        await usersRepository.update({
            data: {
                password: hashedPassword,
            },
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });

        const passwordResetDone = require(`../emailTemplates/${language}/passwordResetDone`);
        const { subject, body } = passwordResetDone(
            user.firstname,
            user.lastname
        );
        await sendMail(user.email, subject, null, body);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const sendVerificationEmail = async function (email, language = "de") {
    try {
        // const user = await userRepo.getUserWithEmail(email);
        const user = await usersRepository.getOne({
            filters: [
                {
                    key: "email",
                    sign: "=",
                    value: email,
                },
            ],
        });
        if (!user) {
            throw new AppError(`email_does_not_exist`, 400, undefined, {
                email,
            });
        }
        if (user.emailVerified) {
            throw new AppError(`email_verified`, 400);
        }

        // await tokenRepo.deleteVerificationToken({ userId: user.id });
        await verificationTokenRepository.delete({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: user.id,
                },
            ],
        });

        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: getDateInFormate(now),
        };
        // TODO: implement transaction
        // await tokenRepo.insertVerificationTokenData(tokenData);
        await verificationTokenRepository.create({
            data: tokenData,
        });

        const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            user.firstname,
            user.lastname,
            token,
            user.id,
            language
        );
        await sendMail(user.email, subject, null, body);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const verifyEmail = async function (userId, token, language = "de") {
    try {
        // const user = await userRepo.getUserDataById(userId);
        const user = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!user) {
            throw new AppError(`user_id_does_not_exist`, 400, undefined, {
                id: userId,
            });
        }
        if (user.emailVerified) {
            return "Email has already been vefified!!";
        }

        // const tokenData = await tokenRepo.getEmailVerificationToken(userId, token);
        const tokenData = await verificationTokenRepository.getOne({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
                {
                    key: "token",
                    sign: "=",
                    value: token,
                },
            ],
        });
        if (!tokenData) {
            throw new AppError(`invalid_data`, 400);
        }

        const transaction = await usersRepository.createTransaction();
        try {
            // await tokenRepo.deleteVerificationToken({ userId, token });
            await verificationTokenRepository.deleteWithTransaction(
                {
                    filters: [
                        {
                            key: "userId",
                            sign: "=",
                            value: userId,
                        },
                        {
                            key: "token",
                            sign: "=",
                            value: token,
                        },
                    ],
                },
                transaction
            );

            if (tokenData.expiresAt < getDateInFormate(new Date())) {
                throw new AppError(`send_mail_again`, 400);
            }

            // await userRepo.updateUserById(userId, { emailVerified: true });
            await usersRepository.updateWithTransaction(
                {
                    data: {
                        emailVerified: true,
                    },
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: userId,
                        },
                    ],
                },
                transaction
            );

            await usersRepository.commitTransaction(transaction);
        } catch (err) {
            await usersRepository.rollbackTransaction(transaction);
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        const verificationDone = require(`../emailTemplates/${language}/verificationDone`);
        const { subject, body } = verificationDone(
            user.firstname,
            user.lastname
        );
        await sendMail(user.email, subject, null, body);
        return "The Email Verification was successfull!";
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const logout = async function (userId, refreshToken, deviceToken) {
    try {
        // const token = await tokenRepo.getRefreshTokenByRefreshToken(refreshToken);
        const token = await tokenRepository.getOne({
            filters: [
                {
                    key: "refreshToken",
                    sign: "=",
                    value: refreshToken,
                },
            ],
        });
        if (!token) {
            throw new AppError(`user_id_does_not_exist`, 404, undefined, {
                id: refreshToken,
            });
        }
        if (!deviceToken) {
            throw new AppError(`device_token_missing`, 400);
        }
        // await tokenRepo.deleteRefreshTokenFor({ refreshToken, userId });
        await tokenRepository.delete({
            filters: [
                {
                    key: "refreshToken",
                    sign: "=",
                    value: refreshToken,
                },
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        // also delete deviceAddress firebase token
        await firebaseTokenRepository.delete({
            filters: [
                {
                    key: "deviceAddress",
                    sign: "=",
                    value: deviceToken,
                },
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
            ],
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getUsers = async function (userIds, username, reqUserId) {
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
        "blocked",
    ];
    const filter = [];
    if (userIds) {
        filter.push({
            key: "id",
            sign: "IN",
            value: userIds,
        });
    }
    if (username) {
        filter.push({
            key: "username",
            sign: "=",
            value: username,
        });
    }
    if (!filter) {
        throw new AppError("filter_missing");
    }
    try {
        // const users = await userRepo.getAllUsers(filter, columsToQuery);
        const userrResp = await usersRepository.getAll({
            filters: filter,
            columns: columsToQuery,
        });
        const users = userrResp.rows;
        users.forEach((user) => {
            if (user.id !== reqUserId) {
                user.email = "***@***.**";
                user.socialMedia = "Hidden";
                user.website = "Hidden";
                user.description = "Hidden";
                user.firstname = "Hidden";
                user.lastname = "Hidden";
            }
        });
        return users;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const listLoginDevices = async function (userId, refreshToken) {
    try {
        // const tokens = await tokenRepo.fetchRefreshTokensOtherThan(
        //     userId,
        //     refreshToken,
        // );
        // if refresh token is not an array, convert it to an array
        if (!Array.isArray(refreshToken)) {
            refreshToken = [refreshToken];
        }
        const tokens = await tokenRepository.getAll({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
                {
                    key: "refreshToken",
                    sign: "NOT IN",
                    value: refreshToken,
                },
            ],
        });
        return tokens;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteLoginDevices = async function (paramId, queryId) {
    try {
        if (!queryId) {
            // await tokenRepo.deleteRefreshToken(paramId);
            await tokenRepository.delete({
                filters: [
                    {
                        key: "userId",
                        sign: "=",
                        value: paramId,
                    },
                ],
            });
        } else {
            // await tokenRepo.deleteRefreshTokenFor({ paramId, id: queryId });
            await tokenRepository.delete({
                filters: [
                    {
                        key: "userId",
                        sign: "=",
                        value: paramId,
                    },
                    {
                        key: "id",
                        sign: "=",
                        value: queryId,
                    },
                ],
            });
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const uploadUserProfileImage = async function (id, image) {
    try {
        const imagePath = `user_${id}/profilePic_${Date.now()}`;

        const { uploadStatus } = await imageUpload(image, imagePath);
        if (uploadStatus === "Success") {
            const updationData = {};
            updationData.image = imagePath;
            // await userRepo.updateUserById(id, updationData);
            await usersRepository.update({
                data: updationData,
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: id,
                    },
                ],
            });
            return updationData;
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteUserProfileImage = async function (userId) {
    try {
        // const user = await userRepo.getUserDataById(userId);
        const user = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!user) {
            throw new AppError(`user_id_does_not_exist`, 404, undefined, {
                id: userId,
            });
        }

        const onSuccess = async () => {
            const updationData = {};
            updationData.image = "";

            // await userRepo.updateUserById(userId, updationData);
            await usersRepository.update({
                data: updationData,
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: userId,
                    },
                ],
            });
        };
        const onFail = (err) => {
            throw new AppError("Image Delete failed with Error Code: " + err);
        };
        await objectDelete(user.image, onSuccess, onFail);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getUserListings = async function (
    userId,
    pageNo,
    pageSize,
    statusId,
    categoryId,
    subcategoryId,
    requesterRoleId = null,
    requesterId = null
) {
    const filters = [];

    // Validate userId, pageNo, and pageSize
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        throw new AppError(`invalid_user_id`, 400, undefined, { id: userId });
    }
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        throw new AppError(`postive_page_no`, 400);
    }
    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        throw new AppError(`positive_page_size`, 400);
    }

    // Validate and apply statusId filter
    if (statusId) {
        if (isNaN(Number(statusId)) || Number(statusId) <= 0) {
            throw new AppError(`invalid_status`, 400, undefined, { statusId });
        }

        try {
            const status = await statusRepository.getOne({
                filters: [{ key: "id", sign: "=", value: statusId }],
            });
            if (!status) {
                throw new AppError(`invalid_status`, 400, undefined, {
                    statusId,
                });
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        // filters.statusId = statusId;
        filters.push({
            key: "statusId",
            sign: "=",
            value: statusId,
        });
    }

    // Validate and apply categoryId and subcategoryId filters
    if (categoryId) {
        if (isNaN(Number(categoryId)) || Number(categoryId) <= 0) {
            throw new AppError(`Invalid category ${categoryId}`, 400);
        }

        try {
            const category = await categoryRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: categoryId,
                    },
                ],
            });
            if (!category) {
                throw new AppError(`invalid_category`, 400, undefined, {
                    categoryId,
                });
            }

            // filters.categoryId = categoryId;
            filters.push({
                key: "categoryId",
                sign: "=",
                value: categoryId,
            });

            if (subcategoryId) {
                if (
                    isNaN(Number(subcategoryId)) ||
                    Number(subcategoryId) <= 0
                ) {
                    throw new AppError(`invalid_subcategory`, 400, undefined, {
                        subcategoryId,
                    });
                }

                try {
                    const subcategory = await subCategoryRepository.getOne({
                        filters: [
                            {
                                key: "id",
                                sign: "=",
                                value: subcategoryId,
                            },
                            {
                                key: "categoryId",
                                sign: "=",
                                value: categoryId,
                            },
                        ],
                    });
                    if (!subcategory) {
                        throw new AppError(
                            `invalid_subcategory`,
                            400,
                            undefined,
                            { subcategoryId }
                        );
                    }
                } catch (err) {
                    if (err instanceof AppError) throw err;
                    throw new AppError(err);
                }
                // filters.subcategoryId = subcategoryId;
                filters.push({
                    key: "subcategoryId",
                    sign: "=",
                    value: subcategoryId,
                });
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    // Determine listing scope based on requester role
    try {
        // Admin: return all listings (do not filter by user)
        if (requesterRoleId === roles.Admin) {
            const data = await listingRepository.retrieveListings({
                filters,
                pageNo,
                pageSize,
                statusId: "*",
            });
            return data;
        }

        // City Admin: return listings for cities the requester administers
        if (requesterRoleId === roles["City Admin"]) {
            const adminCityRows = await cityUserRolesRepository.getAll({
                columns: "cityId",
                filters: [
                    { key: "userId", sign: "=", value: requesterId },
                    { key: "isAdmin", sign: "=", value: 1 },
                ],
            });
            const cityIds = [
                ...new Set((adminCityRows.rows || []).map((r) => r.cityId)),
            ];
            if (cityIds.length === 0) return [];
            const data = await listingRepository.retrieveListings({
                filters,
                cities: cityIds,
                pageNo,
                pageSize,
                statusId: "*",
            });
            return data;
        }

        // Moderator: return listings for cities the moderator is assigned to
        if (requesterRoleId === roles.Moderator) {
            const modRows = await moderatorsRepository.getAll({
                filters: [{ key: "userId", sign: "=", value: requesterId }],
                columns: ["id", "cityId"],
            });

            const modIds = (modRows.rows || []).map((r) => r.id);
            const cityIds = [
                ...new Set((modRows.rows || []).map((r) => r.cityId)),
            ];
            if (cityIds.length === 0) return [];

            const categoryFilterIds = new Set();

            if (modIds.length > 0) {
                // Get all permissions assigned to these moderators
                const modPerms = await moderatorPermissionsRepository.getAll({
                    filters: [
                        { key: "moderatorId", sign: "IN", value: modIds },
                    ],
                    columns: ["permissionId"],
                });

                const permIds = [
                    ...new Set(
                        (modPerms.rows || []).map((p) => p.permissionId)
                    ),
                ];
                if (permIds.length > 0) {
                    const perms = await permissionsRepository.getAll({
                        filters: [{ key: "id", sign: "IN", value: permIds }],
                        columns: ["id", "name"],
                    });

                    const permNames = (perms.rows || []).map((p) =>
                        p.name.toLowerCase()
                    );

                    // Determine accessible categories
                    if (permNames.includes("create_event")) {
                        categoryFilterIds.add(3);
                    }
                    if (permNames.includes("create_news")) {
                        categoryFilterIds.add(1);
                    }
                }
            }

            // If moderator has no recognized category permission, they see nothing
            if (categoryFilterIds.size === 0) {
                return [];
            }

            // Apply city + category filter
            const data = await listingRepository.retrieveListings({
                filters: [
                    ...filters,
                    {
                        key: "categoryId",
                        sign: "IN",
                        value: Array.from(categoryFilterIds),
                    },
                ],
                cities: cityIds,
                pageNo,
                pageSize,
                statusId: "*",
            });

            return data;
        }

        // Default: return listings created by the target user
        if (userId) {
            filters.push({ key: "userId", sign: "=", value: userId });
        }
        const data = await listingRepository.retrieveListings({
            filters,
            pageNo,
            pageSize,
            statusId: "*",
        });
        return data;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteUser = async function (userId) {
    try {
        // implement transaction
        // const userData = await userRepo.getUserDataById(userId);
        const userData = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!userData) {
            throw new AppError(`user_id_does_not_exist`, 404, undefined, {
                id: userId,
            });
        }

        // const cityUsers = await userRepo.getuserCityMappings(userId);
        const cityUsersData = await userCityUserMappingRepository.getAll({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
            ],
            columns: ["cityId, cityUserId"],
        });
        const cityUsers = cityUsersData.rows;

        const userImageList = await getUserImages(userId);

        await imageDeleteAsync.deleteMultiple(
            userImageList.map((image) => ({ Key: image.Key._text }))
        );
        for (const cityUser of cityUsers) {
            await usersRepository.deleteCityUserProcedure(
                cityUser.cityUserId,
                cityUser.cityId
            );
        }
        await usersRepository.deleteCoreUserProcedure(userId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const storeFirebaseUserToken = async function (
    userId,
    newFirebaseToken,
    deviceToken
) {
    try {
        const userData = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!userData) {
            throw new AppError(`user_id_does_not_exist`, 404, undefined, {
                id: userId,
            });
        }

        const response = await firebaseTokenRepository.getOne({
            filters: [
                {
                    key: "deviceAddress",
                    sign: "=",
                    value: deviceToken,
                },
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!response) {
            const insertionData = {};
            insertionData.userId = userId;
            insertionData.firebaseToken = newFirebaseToken;
            insertionData.createdAt = getDateInFormate(new Date());
            insertionData.deviceAddress = deviceToken;
            await firebaseTokenRepository.create({
                data: insertionData,
            });
        } else {
            const firebaseTokenUpdationData = response;
            firebaseTokenUpdationData.firebaseToken = newFirebaseToken;
            firebaseTokenUpdationData.createdAt = getDateInFormate(new Date());
            await firebaseTokenRepository.update({
                data: firebaseTokenUpdationData,
                filters: [
                    {
                        key: "deviceAddress",
                        sign: "=",
                        value: deviceToken,
                    },
                    {
                        key: "userId",
                        sign: "=",
                        value: userId,
                    },
                ],
            });
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const blockUser = async function (userId, requesterRoleId, targetUserId) {
    try {
        // Only Admin can block users
        if (requesterRoleId !== roles.Admin) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }

        if (isNaN(Number(targetUserId)) || Number(targetUserId) <= 0) {
            throw new AppError("Invalid user ID", 400);
        }

        // Cannot block self
        if (userId === Number(targetUserId)) {
            throw new AppError("You cannot block yourself", 400);
        }

        const user = await usersRepository.getOne({
            filters: [{ key: "id", sign: "=", value: targetUserId }],
            columns: "id, username, blocked",
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.blocked) {
            throw new AppError("User is already blocked", 400);
        }

        await usersRepository.update({
            data: { blocked: true },
            filters: [{ key: "id", sign: "=", value: targetUserId }],
        });

        return {
            success: true,
            message: `User ${user.username} has been blocked`,
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const unblockUser = async function (userId, requesterRoleId, targetUserId) {
    try {
        // Only Admin can unblock users
        if (requesterRoleId !== roles.Admin) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }

        if (isNaN(Number(targetUserId)) || Number(targetUserId) <= 0) {
            throw new AppError("Invalid user ID", 400);
        }

        // Cannot unblock self (though they wouldn't be able to call this if blocked)
        if (userId === Number(targetUserId)) {
            throw new AppError("You cannot unblock yourself", 400);
        }

        const user = await usersRepository.getOne({
            filters: [{ key: "id", sign: "=", value: targetUserId }],
            columns: "id, username, blocked",
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.blocked) {
            throw new AppError("User is not blocked", 400);
        }

        await usersRepository.update({
            data: { blocked: false },
            filters: [{ key: "id", sign: "=", value: targetUserId }],
        });

        return {
            success: true,
            message: `User ${user.username} has been unblocked`,
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    register,
    login,
    getUserById,
    updateUser,
    refreshAuthToken,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    logout,
    getUsers,
    listLoginDevices,
    deleteLoginDevices,
    uploadUserProfileImage,
    deleteUserProfileImage,
    getUserListings,
    deleteUser,
    storeFirebaseUserToken,
    blockUser,
    unblockUser,
};
