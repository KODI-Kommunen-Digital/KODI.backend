const bcrypt = require("bcrypt");
const crypto = require("crypto");
const database = require("../services/database");
const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const roles = require("../constants/roles");
const sendMail = require("../services/sendMail");
const getDateInFormate = require("../utils/getDateInFormate");
const supportedSocialMedia = require("../constants/supportedSocialMedia");
const { getUserWithUsername, getUserByUsernameOrEmail, createUser, addVerificationToken, getUserWithEmail, getuserCityMappings, getRefreshToken, deleteRefreshToken, insertRefreshTokenData, getUserWithId, getCityUser } = require("../services/users");
const { getCityWithId } = require("../services/cities");

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

            const user = await getUserWithUsername(payload.username);
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
            const user = await getUserWithEmail(payload.email);
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
        const response = await createUser(insertionData, connection);

        const userId = response.id;
        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId,
            token,
            expiresAt: getDateInFormate(now),
        };
        await addVerificationToken(tokenData, connection);

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

        const userData = await getUserByUsernameOrEmail(payload.username, payload.username);
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

        const userMappings = await getuserCityMappings(userData.id);

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

            const cityUser = await getCityUser(cityId, userId);
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
        const data = await getUserWithId(userId);
        if (!data) {
            return next(
                new AppError(`User with id ${userId} does not exist`, 404)
            );
        }
        return res.status(200).json({
            status: "success",
            data: data,
        });
    }catch(err){
        return next(new AppError(err));
    }
}
module.exports = {
    register,
    login,
    getUserById,
};