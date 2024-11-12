const bcrypt = require("bcrypt");
const crypto = require("crypto");
const database = require("../utils/database");
const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const roles = require("../constants/roles");
const sendMail = require("../utils/sendMail");
const getDateInFormate = require("../utils/getDateInFormate");
const supportedSocialMedia = require("../constants/supportedSocialMedia");
const userRepo = require("../repository/users");
const {
    getCityWithId,
    getCityUserCityMapping,
} = require("../repository/cities");
const tokenRepo = require("../repository/auth");
const imageUpload = require("../utils/imageUpload");
const objectDelete = require("../utils/imageDelete");
const cityListings = require("../repository/cityListing");
const tokenUtil = require("../utils/token");
const { getUserImages } = require("../repository/image");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const storedProcedures = require("../constants/storedProcedures");

const register = async function (payload) {
    const insertionData = {};
    if (!payload) {
        throw new AppError(`Empty payload sent`, 400, errorCodes.EMPTY_PAYLOAD);
    }
    const language = payload.language || "de";
    if (language !== "en" && language !== "de") {
        throw new AppError(
            `Incorrect language given`,
            400,
            errorCodes.INVALID_LANGUAGE,
        );
    }

    if (!payload.username) {
        throw new AppError(
            `Username is not present`,
            400,
            errorCodes.MISSING_USERNAME,
        );
    } else {
        if (payload.username.length > 40) {
            throw new AppError(
                `Username too long. Maximum 40 characters allowed.`,
                400,
                errorCodes.INVALID_USERNAME,
            );
        }
        try {
            const user = await userRepo.getUserWithUsername(payload.username);
            if (user) {
                throw new AppError(
                    `User with username '${payload.username}' already exists`,
                    400,
                    errorCodes.USER_ALREADY_EXISTS,
                );
            }

            if (
                /\s/.test(payload.username) ||
                /^_/.test(payload.username) ||
                /^[^a-z_]/.test(payload.username)
            ) {
                throw new AppError(
                    `Username '${payload.username}' is not valid`,
                    400,
                    errorCodes.INVALID_USERNAME,
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        insertionData.username = payload.username;
    }

    if (!payload.email) {
        throw new AppError(`Email is not present`, 400, errorCodes.MISSING_EMAIL);
    } else {
        try {
            const user = await userRepo.getUserWithEmail(payload.email);
            if (user) {
                throw new AppError(
                    `User with email '${payload.email}' is already registered`,
                    400,
                    errorCodes.EMAIL_ALREADY_EXISTS,
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
            `Firstname is not present`,
            400,
            errorCodes.MISSING_FIRSTNAME,
        );
    } else {
        if (payload.firstname.length > 40) {
            throw new AppError(
                `Firstname too long. Maximum 40 characters allowed`,
                400,
                errorCodes.INVALID_CREDENTIALS,
            );
        }
        insertionData.firstname = payload.firstname;
    }

    if (!payload.lastname) {
        throw new AppError(
            `Lastname is not present`,
            400,
            errorCodes.MISSING_LASTNAME,
        );
    } else {
        if (payload.lastname.length > 40) {
            throw new AppError(
                `Lastname too long. Maximum 40 characters allowed`,
                400,
                errorCodes.INVALID_CREDENTIALS,
            );
        }
        insertionData.lastname = payload.lastname;
    }

    if (!payload.password) {
        throw new AppError(
            `Password is not present`,
            400,
            errorCodes.MISSING_PASSWORD,
        );
    } else {
        if (payload.password.length > 64) {
            throw new AppError(
                `Password too long. Maximum 64 characters allowed.`,
                400,
                errorCodes.INVALID_PASSWORD,
            );
        }
        const re = /^\S{8,}$/;
        if (!re.test(payload.password)) {
            throw new AppError(
                `Invalid Password. `,
                400,
                errorCodes.INVALID_PASSWORD,
            );
        } else {
            insertionData.password = await bcrypt.hash(
                payload.password,
                Number(process.env.SALT),
            );
        }
    }

    if (payload.email) {
        insertionData.email = payload.email;
    }

    if (payload.phoneNumber) {
        const re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (!re.test(payload.phoneNumber))
            throw new AppError("Phone number is not valid");
        insertionData.website = payload.website;
    }

    if (payload.description) {
        if (payload.description.length > 255) {
            throw new AppError(
                `Length of Description cannot exceed 255 characters`,
                400,
            );
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
                    throw new AppError(`Unsupported social media '${socialMedia}'`, 400);
                }

                if (
                    typeof socialMediaList[socialMedia] !== "string" ||
                    !socialMediaList[socialMedia].includes(socialMedia.toLowerCase())
                ) {
                    throw new AppError(
                        `Invalid input given for social media '${socialMedia}' `,
                        400,
                    );
                }
            });
            insertionData.socialMedia = JSON.stringify(socialMediaList);
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(`Invalid input given for social media`, 400);
        }
    }

    const connection = await database.createTransaction();
    try {
        const response = await userRepo.createUser(insertionData, connection);

        const userId = response.id;
        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId,
            token,
            expiresAt: getDateInFormate(now),
        };
        await userRepo.addVerificationToken(tokenData, connection);

        const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            insertionData.firstname,
            insertionData.lastname,
            token,
            userId,
            language,
        );
        await sendMail(insertionData.email, subject, null, body);

        database.commitTransaction(connection);

        return userId;
    } catch (err) {
        if (err instanceof AppError) throw err;
        database.rollbackTransaction(connection);
        throw new AppError(err);
    }
};

const login = async function (payload, sourceAddress, browsername, devicetype) {
    try {
        const userData = await userRepo.getUserByUsernameOrEmail(
            payload.username,
            payload.username,
        );
        if (!userData) {
            throw new AppError(
                `Invalid username or email`,
                401,
                errorCodes.INVALID_CREDENTIALS,
            );
        }

        if (!userData.emailVerified) {
            throw new AppError(
                `Verification email sent to your email id. Please verify first before trying to login.`,
                401,
                errorCodes.EMAIL_NOT_VERIFIED,
            );
        }

        const correctPassword = await bcrypt.compare(
            payload.password,
            userData.password,
        );
        if (!correctPassword) {
            throw new AppError(`Invalid password`, 401, errorCodes.INVALID_PASSWORD);
        }

        const userMappings = await userRepo.getuserCityMappings(userData.id);

        const tokens = tokenUtil.generator({
            userId: userData.id,
            roleId: userData.roleId,
            rememberMe: payload.rememberMe,
        });

        const refreshTokens = await tokenRepo.getRefreshTokens(userData.id);
        if (refreshTokens.length) {
            const tokensToDelete = refreshTokens.filter(
                (token) =>
                    token.sourceAddress === sourceAddress &&
                    (token.browser === browsername || (!token.browser && !browsername)) &&
                    (token.device === devicetype || (!token.device && !devicetype)),
            );

            const tokenDeletes = tokensToDelete.map((token) =>
                tokenRepo.deleteRefreshTokenByTokenUid(token.id),
            );
            await Promise.all(tokenDeletes);
        }
        const insertionData = {
            userId: userData.id,
            sourceAddress,
            refreshToken: tokens.refreshToken,
            browser: browsername,
            device: devicetype,
        };

        await tokenRepo.insertRefreshTokenData(insertionData);
        return {
            cityUsers: userMappings,
            userId: userData.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err, 500);
    }
};

const getUserById = async function (userId, cityUser, cityId, reqUserId) {
    if (cityUser) {
        if (!cityId) {
            throw new AppError(`City id not given`, 400);
        }
        if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            throw new AppError(`Invalid cityId ${cityId}`, 400);
        }
        try {
            const city = await getCityWithId(cityId);
            if (!city) {
                throw new AppError(`City with id ${cityId} does not exist`, 400);
            }

            const cityUser = await userRepo.getCityUser(cityId, userId);
            if (!cityUser) {
                throw new AppError(
                    `User ${userId} is not found in city ${cityId}`,
                    404,
                );
            }
            userId = cityUser.userId;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    try {
        const userData = await userRepo.getUserWithId(userId);
        if (!userData) {
            throw new AppError(`User with id ${userId} does not exist`, 404);
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

const updateUser = async function (id, payload) {
    const updationData = {};

    const currentUserData = await userRepo.getUserDataById(id);
    if (!currentUserData) {
        throw new AppError(`User with id ${id} does not exist`, 404);
    }

    if (payload.username && payload.username !== currentUserData.username) {
        throw new AppError(`Username cannot be edited`, 400);
    }

    if (payload.email && payload.email !== currentUserData.email) {
        const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(payload.email)) {
            throw new AppError(`Invalid email given`, 400);
        }
        updationData.email = payload.email;
    }

    if (payload.firstname) {
        updationData.firstname = payload.firstname;
    }

    if (payload.newPassword) {
        if (!payload.currentPassword) {
            throw new AppError(`Current password not given to update password`, 400);
        }
        const currentPasswordCorrect = await bcrypt.compare(
            payload.currentPassword,
            currentUserData.password,
        );
        if (!currentPasswordCorrect) {
            throw new AppError(
                `Incorrect current password given`,
                401,
                errorCodes.INVALID_PASSWORD,
            );
        }
        const passwordCheck = await bcrypt.compare(
            payload.newPassword,
            currentUserData.password,
        );
        if (passwordCheck) {
            throw new AppError(
                `New password should not be same as the old password`,
                400,
                errorCodes.SAME_PASSWORD_GIVEN,
            );
        }
        updationData.password = await bcrypt.hash(
            payload.newPassword,
            Number(process.env.SALT),
        );
    }

    if (payload.lastname) {
        updationData.lastname = payload.lastname;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "phoneNumber")) {
        const re = /^(\d{8,15})$/;
        if (payload.phoneNumber !== "" && !re.test(payload.phoneNumber)) {
            throw new AppError("Phone number is not valid", 400);
        }
        // If phoneNumber is an empty string, set it to null
        updationData.phoneNumber =
            payload.phoneNumber === "" ? null : payload.phoneNumber;
    }

    if (payload.description) {
        if (payload.description.length > 255) {
            throw new AppError(
                `Length of Description cannot exceed 255 characters`,
                400,
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
                throw new AppError(`Unsupported social media '${socialMedia}'`, 400);
            }

            if (
                typeof socialMedia[Object.keys(socialMedia)[0]] !== "string" ||
                !socialMedia[Object.keys(socialMedia)[0]].includes(
                    Object.values(socialMedia)[0].toLowerCase(),
                )
            ) {
                throw new AppError(
                    `Invalid input given for social '${socialMedia}' `,
                    400,
                );
            }
        });
        updationData.socialMedia = JSON.stringify(socialMediaList);
    }

    if (Object.keys(updationData).length > 0) {
        // TODO add transaction
        try {
            const cityUserResponse = await userRepo.getuserCityMappings(id);
            await userRepo.updateUserById(id, updationData);

            const cityUserUpdationData = { ...updationData, coreuserId: id };
            delete cityUserUpdationData.password;
            delete cityUserUpdationData.socialMedia;

            for (const element of cityUserResponse.rows) {
                await userRepo.updateCityUserById(
                    element.cityUserId,
                    cityUserUpdationData,
                    element.cityId,
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
};

const refreshAuthToken = async function (userId, sourceAddress, refreshToken) {
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        throw new AppError(`Invalid UserId ${userId}`, 404);
    }

    try {
        if (!refreshToken) {
            throw new AppError(`Refresh token not present`, 400);
        }

        const decodedToken = tokenUtil.verify(
            refreshToken,
            process.env.REFRESH_PUBLIC,
        );
        if (decodedToken.userId !== parseInt(userId)) {
            throw new AppError(`Invalid refresh token`, 403);
        }

        const refreshTokenData =
            await tokenRepo.getRefreshTokenByRefreshToken(refreshToken);
        if (!refreshTokenData) {
            throw new AppError(`Invalid refresh token`, 400);
        }

        if (refreshTokenData.userId !== parseInt(userId)) {
            throw new AppError(`Invalid refresh token`, 400);
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

        await tokenRepo.deleteRefreshTokenByTokenUid(refreshTokenData.id);

        await tokenRepo.insertRefreshTokenData(insertionData);

        return {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
        };
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            await tokenRepo.deleteRefreshTokenByRefreshToken(refreshToken);
            throw new AppError(`Unauthorized! Refresh Token was expired!`, 401);
        }
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const forgotPassword = async function (username, language = "de") {
    const transaction = await database.createTransaction();
    try {
        const user = await userRepo.getUserByUsernameOrEmail(username, username);
        if (!user) {
            throw new AppError(`Username ${username} does not exist`, 404);
        }

        await userRepo.deleteForgotTokenForUserWithConnection(user.id, transaction);

        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: getDateInFormate(now),
        };

        await userRepo.addForgotPasswordTokenWithConnection(tokenData, transaction);

        const resetPasswordEmail = require(
            `../emailTemplates/${language}/resetPasswordEmail`,
        );
        const { subject, body } = resetPasswordEmail(
            user.firstname,
            user.lastname,
            token,
            user.id,
        );
        await sendMail(user.email, subject, null, body);

        await database.commitTransaction(transaction);
    } catch (err) {
        await database.rollbackTransaction(transaction);
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const resetPassword = async function (userId, language, token, password) {
    try {
        const user = await userRepo.getUserDataById(userId);
        if (!user) {
            throw new AppError(`UserId ${userId} does not exist`, 400);
        }

        const passwordCheck = await bcrypt.compare(password, user.password);
        if (passwordCheck) {
            throw new AppError(
                `New password should not be same as the old password`,
                400,
                errorCodes.NEW_OLD_PASSWORD_DIFFERENT,
            );
        }
        const tokenData = await tokenRepo.getForgotPasswordToken(userId, token);
        if (!tokenData) {
            throw new AppError(`Invalid data sent`, 400);
        }
        await tokenRepo.deleteForgotPasswordToken(userId, token);

        if (tokenData.expiresAt < new Date().toLocaleString()) {
            throw new AppError(`Token Expired`, 400);
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(process.env.SALT),
        );

        await userRepo.updateUserById(userId, { password: hashedPassword });

        const passwordResetDone = require(
            `../emailTemplates/${language}/passwordResetDone`,
        );
        const { subject, body } = passwordResetDone(user.firstname, user.lastname);
        await sendMail(user.email, subject, null, body);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const sendVerificationEmail = async function (email, language = "de") {
    try {
        const user = await userRepo.getUserWithEmail(email);
        if (!user) {
            throw new AppError(`Email ${email} does not exist`, 400);
        }
        if (user.emailVerified) {
            throw new AppError(`Email already verified`, 400);
        }

        await tokenRepo.deleteVerificationToken({ userId: user.id });

        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: getDateInFormate(now),
        };
        await tokenRepo.insertVerificationTokenData(tokenData);

        const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            user.firstname,
            user.lastname,
            token,
            user.id,
            language,
        );
        await sendMail(user.email, subject, null, body);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const verifyEmail = async function (userId, token, language = "de") {
    try {
        const user = await userRepo.getUserDataById(userId);
        if (!user) {
            throw new AppError(`UserId ${userId} does not exist`, 400);
        }
        if (user.emailVerified) {
            return "Email has already been vefified!!";
        }

        const tokenData = await tokenRepo.getEmailVerificationToken(userId, token);
        if (!tokenData) {
            throw new AppError(`Invalid data sent`, 400);
        }

        await tokenRepo.deleteVerificationToken({ userId, token });

        if (tokenData.expiresAt < new Date().toLocaleString()) {
            throw new AppError(`Token Expired, send verification mail again`, 400);
        }

        await userRepo.updateUserById(userId, { emailVerified: true });

        const verificationDone = require(
            `../emailTemplates/${language}/verificationDone`,
        );
        const { subject, body } = verificationDone(user.firstname, user.lastname);
        await sendMail(user.email, subject, null, body);
        return "The Email Verification was successfull!";
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const logout = async function (userId, refreshToken) {
    try {
        const token = await tokenRepo.getRefreshTokenByRefreshToken(refreshToken);
        if (!token) {
            throw new AppError(`User with id ${refreshToken} does not exist`, 404);
        }
        await tokenRepo.deleteRefreshTokenFor({ refreshToken, userId });
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
    ];
    let filter = {};
    if (userIds) {
        filter = {
            id: userIds,
        };
    }
    if (username) {
        filter.username = username;
    }
    if (!filter) {
        throw new AppError("You need to send some params to filter");
    }
    try {
        const users = await userRepo.getAllUsers(filter, columsToQuery);
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
        const tokens = await tokenRepo.fetchRefreshTokensOtherThan(
            userId,
            refreshToken,
        );
        return tokens;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteLoginDevices = async function (paramId, queryId) {
    try {
        if (!queryId) {
            await tokenRepo.deleteRefreshToken(paramId);
        } else {
            await tokenRepo.deleteRefreshTokenFor({ paramId, id: queryId });
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
            await userRepo.updateUserById(id, updationData);
            return updationData;
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteUserProfileImage = async function (userId) {
    try {
        const user = await userRepo.getUserDataById(userId);
        if (!user) {
            throw new AppError(`User ${userId} does not exist`, 404);
        }

        const onSuccess = async () => {
            const updationData = {};
            updationData.image = "";

            await userRepo.updateUserById(userId, updationData);
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
) {
    const filters = {};

    if (statusId) {
        try {
            const data = await cityListings.getStatusById(statusId);
            if (!data) {
                throw new AppError(`Invalid Status '${statusId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.statusId = statusId;
    }

    if (categoryId) {
        try {
            const data = await cityListings.getCategoryById(categoryId);
            if (!data) {
                throw new AppError(`Invalid Category '${categoryId}' given`, 400);
            } else {
                if (subcategoryId) {
                    try {
                        const data = await cityListings.getSubCategoryWithFilter(
                            categoryId,
                            subcategoryId,
                        );
                        if (!data) {
                            throw new AppError(
                                `Invalid subCategory '${subcategoryId}' given`,
                                400,
                            );
                        }
                    } catch (err) {
                        if (err instanceof AppError) throw err;
                        throw new AppError(err);
                    }
                    filters.subcategoryId = subcategoryId;
                }
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.categoryId = categoryId;
    }

    try {
        const cityMappings = await getCityUserCityMapping(userId);
        const data = await userRepo.getUserListingsFromDatabase(
            userId,
            filters,
            cityMappings,
            pageNo,
            pageSize,
        );
        return data;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteUser = async function (userId) {
    try {
        const userData = await userRepo.getUserDataById(userId);
        if (!userData) {
            throw new AppError(`User with id ${userId} does not exist`, 404);
        }

        const cityUsers = await userRepo.getuserCityMappings(userId);

        const userImageList = await getUserImages(userId);

        await imageDeleteAsync.deleteMultiple(
            userImageList.map((image) => ({ Key: image.Key._text })),
        );
        for (const cityUser of cityUsers) {
            await database.callStoredProcedure(
                storedProcedures.DELETE_CITY_USER,
                [cityUser.cityUserId],
                cityUser.cityId,
            );
        }
        await database.callStoredProcedure(storedProcedures.DELETE_CORE_USER, [
            userId,
        ]);
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
};
