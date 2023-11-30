const bcrypt = require("bcrypt");
const crypto = require("crypto");
const database = require("../services/database");
const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const roles = require("../constants/roles");
const sendMail = require("../services/sendMail");
const getDateInFormate = require("../utils/getDateInFormate");
const supportedSocialMedia = require("../constants/supportedSocialMedia");
const userService = require("../services/users");
const { getCityWithId } = require("../services/cities");
const { getRefreshToken, deleteRefreshToken, insertRefreshTokenData, getRefreshTokenByRefreshToken, deleteRefreshTokenByTokenUid, deleteRefreshTokenByRefreshToken, getForgotPasswordToken, deleteForgotPasswordToken, insertVerificationTokenData, getEmailVerificationToken, deleteVerificationToken, deleteRefreshTokenFor } = require("../services/authService");

const tokenUtil = require("../utils/token");

const register = async function (req, res, next) {
    const payload = req.body;
    const insertionData = {};
    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400, errorCodes.EMPTY_PAYLOAD));
    }
    const language = payload.language || "de";
    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400, errorCodes.INVALID_LANGUAGE));
    }

    if (!payload.username) {
        return next(new AppError(`Username is not present`, 400, errorCodes.MISSING_USERNAME));
    } else {
        try {

            const user = await userService.getUserWithUsername(payload.username);
            if (user) {
                return next(
                    new AppError(
                        `User with username '${payload.username}' already exists`,
                        400,
                        errorCodes.USER_ALREADY_EXISTS
                    )
                );
            }

            if (/\s/.test(payload.username) || /^_/.test(payload.username) || /^[^a-z_]/.test(payload.username)) {
                return next(
                    new AppError(
                        `Username '${payload.username}' is not valid`,
                        400,
                        errorCodes.INVALID_USERNAME
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.username = payload.username;
    }

    if (!payload.email) {
        return next(new AppError(`Email is not present`, 400, errorCodes.MISSING_EMAIL));
    } else {
        try {
            const user = await userService.getUserWithEmail(payload.email);
            if (user) {
                return next(
                    new AppError(
                        `User with email '${payload.email}' is already registered`,
                        400,
                        errorCodes.EMAIL_ALREADY_EXISTS
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
        return next(new AppError(`Firstname is not present`, 400, errorCodes.MISSING_FIRSTNAME));
    } else {
        insertionData.firstname = payload.firstname;
    }

    if (!payload.lastname) {
        return next(new AppError(`Lastname is not present`, 400, errorCodes.MISSING_LASTNAME));
    } else {
        insertionData.lastname = payload.lastname;
    }

    if (!payload.password) {
        return next(new AppError(`Password is not present`, 400, errorCodes.MISSING_PASSWORD));
    } else {
        const re = /^\S{8,}$/;
        if (!re.test(payload.password)) {
            return next(new AppError(`Invalid Password. `, 400, errorCodes.INVALID_PASSWORD));
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

    if (payload.description) {
        if (payload.description.length > 255) {
            return next(
                new AppError(
                    `Length of Description cannot exceed 255 characters`,
                    400
                )
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

    const connection = await database.createTransaction();
    try {
        const response = await userService.createUser(insertionData, connection);

        const userId = response.id;
        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId,
            token,
            expiresAt: getDateInFormate(now),
        };
        await userService.addVerificationToken(tokenData, connection);

        const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
        const { subject, body } = verifyEmail(
            insertionData.firstname,
            insertionData.lastname,
            token,
            userId,
            language
        );
        await sendMail(insertionData.email, subject, null, body);

        database.commitTransaction(connection);

        return res.status(200).json({
            status: "success",
            id: userId,
        });
    } catch (err) {
        database.rollbackTransaction(connection);
        return next(new AppError(err));
    }
}

const login = async function (req, res, next) {
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

        const userData = await userService.getUserByUsernameOrEmail(payload.username, payload.username);
        if (!userData) {
            return next(new AppError(`Invalid username or email`, 401, errorCodes.INVALID_CREDENTIALS));
        }

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

        const userMappings = await userService.getuserCityMappings(userData.id);

        const tokens = tokenUtil.generator({
            userId: userData.id,
            roleId: userData.roleId,
            rememberMe: payload.rememberMe,
        });

        const refreshData = await getRefreshToken(userData.id);
        if (refreshData) {
            if (
                refreshData.sourceAddress === sourceAddress &&
                refreshData.browser === head.browsername &&
                refreshData.device === head.devicetype
            ) {
                await deleteRefreshToken(userData.id);
            }
        }
        const insertionData = {
            userId: userData.id,
            sourceAddress,
            refreshToken: tokens.refreshToken,
            browser: head.browsername,
            device: head.devicetype,
        };

        await insertRefreshTokenData(insertionData);
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
}

const getUserById = async function (req, res, next) {
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
            const city = await getCityWithId(cityId);
            if (!city) {
                return next(
                    new AppError(`City with id ${cityId} does not exist`, 400)
                );
            }

            const cityUser = await userService.getCityUser(cityId, userId);
            if (!cityUser) {
                return next(
                    new AppError(
                        `User ${userId} is not found in city ${cityId}`,
                        404
                    )
                );
            }
            userId = cityUser.userId;
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        const data = await userService.getUserWithId(userId);
        if (!data) {
            return next(
                new AppError(`User with id ${userId} does not exist`, 404)
            );
        }
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

const updateUser = async function (req, res, next) {
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

    const currentUserData = await userService.getUserDataById(id);
    if (!currentUserData) {
        return next(new AppError(`User with id ${id} does not exist`, 404));
    }

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
            !(await bcrypt.compare(payload.currentPassword, currentUserData.password))
        ) {
            return next(new AppError(`Incorrect current password given`, 401));
        }
        const passwordCheck = await bcrypt.compare(
            payload.newPassword,
            currentUserData.password
        );
        if (passwordCheck) {
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
        try {
            await userService.updateUserById(id, updationData);
            res.status(200).json({
                status: "success",
            });
        } catch (err) {
            return next(new AppError(err));
        }
    } else {
        return res.status(200).json({
            status: "success",
        });
    }
}

const refreshAuthToken = async function (req, res, next) {
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

        const refreshTokenData = await getRefreshTokenByRefreshToken(refreshToken);
        if (!refreshTokenData) {
            return next(new AppError(`Invalid refresh token`, 400));
        }

        if (refreshTokenData.userId !== parseInt(userId)) {
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

        await deleteRefreshTokenByTokenUid(refreshTokenData.id)

        await insertRefreshTokenData(insertionData);

        return res.status(200).json({
            status: "success",
            data: {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            },
        });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            await deleteRefreshTokenByRefreshToken(req.body.refreshToken);
            return next(new AppError(`Unauthorized! Token was expired!`, 401));
        }
        return next(new AppError(error));
    }
}

const forgotPassword = async function (req, res, next) {
    const username = req.body.username;
    const language = req.body.language || "de";

    if (!username) {
        return next(new AppError(`Username not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    const transaction = await database.createTransaction();
    try {

        const user = await userService.getUserByUsernameOrEmail(username, username);
        if (!user) {
            return next(
                new AppError(`Username ${username} does not exist`, 404)
            );
        }

        await userService.deleteForgotTokenForUserWithConnection(user.id, transaction);

        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: getDateInFormate(now),
        };

        await userService.addForgotPasswordTokenWithConnection(tokenData, transaction);

        const resetPasswordEmail = require(`../emailTemplates/${language}/resetPasswordEmail`);
        const { subject, body } = resetPasswordEmail(
            user.firstname,
            user.lastname,
            token,
            user.id
        );
        await sendMail(user.email, subject, null, body);

        await database.commitTransaction(transaction);

        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        await database.rollbackTransaction(transaction);
        return next(new AppError(err));
    }
}

const resetPassword = async function (req, res, next) {
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
        const user = await userService.getUserDataById(userId);
        if (!user) {
            return next(new AppError(`UserId ${userId} does not exist`, 400));
        }

        const passwordCheck = await bcrypt.compare(
            password,
            user.password
        );
        if (passwordCheck) {
            return next(new AppError(`New password should not be same as the old password`, 400, errorCodes.NEW_OLD_PASSWORD_DIFFERENT));
        }
        const tokenData = await getForgotPasswordToken(userId, token);
        if (!tokenData) {
            return next(new AppError(`Invalid data sent`, 400));
        }
        await deleteForgotPasswordToken(userId, token);

        if (tokenData.expiresAt < new Date().toLocaleString()) {
            return next(new AppError(`Token Expired`, 400));
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(process.env.SALT)
        );

        await userService.updateUserById(userId, { password: hashedPassword });

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
}

const sendVerificationEmail = async function (req, res, next) {
    const email = req.body.email;
    const language = req.body.language || "de";

    if (!email) {
        return next(new AppError(`Email not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    try {
        const user = await userService.getUserWithEmail(email);
        if (!user) {
            return next(new AppError(`Email ${email} does not exist`, 400));
        }
        if (user.emailVerified) {
            return next(new AppError(`Email already verified`, 400));
        }

        await deleteVerificationToken({ userId: user.id });

        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: user.id,
            token,
            expiresAt: getDateInFormate(now),
        };
        await insertVerificationTokenData(tokenData);

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
}

const verifyEmail = async function (req, res, next) {
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
        const user = await userService.getUserDataById(userId);
        if (!user) {
            return next(new AppError(`UserId ${userId} does not exist`, 400));
        }
        if (user.emailVerified) {
            return res.status(200).json({
                status: "success",
                message: "Email has already been vefified!!",
            });
        }

        const tokenData = await getEmailVerificationToken(userId, token);
        if (!tokenData) {
            return next(new AppError(`Invalid data sent`, 400));
        }

        await deleteVerificationToken({ userId, token });

        if (tokenData.expiresAt < new Date().toLocaleString()) {
            return next(
                new AppError(`Token Expired, send verification mail again`, 400)
            );
        }

        await userService.updateUserById(userId, { emailVerified: true });

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
}

const logout = async function (req, res, next) {
    const userId = parseInt(req.params.id);

    if (userId !== parseInt(req.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    if (!req.body.refreshToken) {
        return next(new AppError(`Refresh Token not sent`, 403));
    }

    try {
        const token = await getRefreshTokenByRefreshToken(req.body.refreshToken);
        if (!token) {
            return next(new AppError(`User with id ${req.body.refreshToken} does not exist`, 404));
        }

        await deleteRefreshTokenFor({ refreshToken: req.body.refreshToken, userId });
        return res.status(200).json({
            status: "success",
        });

    } catch (error) {
        return next(new AppError(error));
    }
}

const getUsers = async function (req, res, next) {
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
            next(new AppError("You can only fetch upto 10 users", 400));
        }
        filter.id = ids;
    }
    if (params.username) {
        filter.username = params.username;
    }
    if (!filter) {
        throw new new AppError("You need to send some params to filter")
    }
    try {
        const users = await userService.getAllUsers(filter, columsToQuery);
        res.status(200).json({
            status: "success",
            data: users,
        });
    } catch (error) {
        return next(new AppError(error));
    }
}

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
};