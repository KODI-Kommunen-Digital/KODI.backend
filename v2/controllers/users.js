const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const userService = require("../services/users");
const notificationService = require("../services/notifications");
const roles = require("../constants/roles");

const register = async function (req, res, next) {
    const payload = req.body;

    try {
        const id = await userService.register(payload, req);
        return res.status(200).json({
            status: "success",
            id,
        });
    } catch (err) {
        return next(err);
    }
};

const login = async function (req, res, next) {
    const payload = req.body;
    const head = req.headers;
    let sourceAddress = req.headers["x-forwarded-for"]
        ? req.headers["x-forwarded-for"].split(",").shift()
        : req.socket.remoteAddress;
    sourceAddress = sourceAddress.toString().replace("::ffff:", "");

    try {
        if (!payload.username && !payload.password) {
            throw new AppError(
                `empty_payload_sent`,
                400,
                errorCodes.EMPTY_PAYLOAD
            );
        }

        if (!payload.username) {
            throw new AppError(
                "username_not_present",
                400,
                errorCodes.MISSING_USERNAME
            );
        }

        if (!payload.password) {
            throw new AppError(
                "missing_password",
                400,
                errorCodes.MISSING_PASSWORD
            );
        }
        const loginRes = await userService.login(
            payload,
            sourceAddress,
            head.browsername,
            head.devicetype,
            req
        );
        res.status(200).json({
            status: "success",
            data: loginRes,
        });
    } catch (err) {
        return next(err);
    }
};

const getUserById = async function (req, res, next) {
    let userId = req.params.id;
    const reqUserId = parseInt(req.userId);
    const cityUser = req.query.cityUser === "true";
    const cityId = req.query.cityId;

    try {
        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 400, undefined, { userId });
        }
        userId = parseInt(userId);
        const data = await userService.getUserById(
            userId,
            cityUser,
            cityId,
            reqUserId
        );
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateUser = async function (req, res, next) {
    const id = Number(req.params.id);
    const payload = req.body;
    const userId = parseInt(req.userId);

    try {
        if (isNaN(id) || id <= 0) {
            throw new AppError("invalid_user_id", 400, undefined, { id });
        }
        if (id !== userId) {
            throw new AppError("access_denied", 403);
        }

        await userService.updateUser(id, payload, req);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const refreshAuthToken = async function (req, res, next) {
    const userId = req.params.id;
    let sourceAddress = req.headers["x-forwarded-for"]
        ? req.headers["x-forwarded-for"].split(",").shift()
        : req.socket.remoteAddress;
    sourceAddress = sourceAddress.toString().replace("::ffff:", "");
    console.log("sourceAddress:", sourceAddress);
    const refreshToken = req.body.refreshToken;

    try {
        const data = await userService.refreshAuthToken(
            userId,
            sourceAddress,
            refreshToken
        );
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        console.error(err);
        return next(err);
    }
};

const forgotPassword = async function (req, res, next) {
    const username = req.body.username;
    const language = req.body.language || "de";
    try {
        if (!username) {
            throw new AppError(`username_not_present`, 400);
        }

        if (language !== "en" && language !== "de") {
            throw new AppError(`Incorrect language given`, 400);
        }
        await userService.forgotPassword(username, language, req);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const resetPassword = async function (req, res, next) {
    const userId = req.body.userId;
    const language = req.body.language || "de";
    const token = req.body.token;
    const password = req.body.password;

    try {
        if (!userId) {
            return next(new AppError("username_not_present", 400));
        }

        if (!token) {
            return next(new AppError("username_not_present", 400));
        }

        if (!password) {
            return next(new AppError("missing_password", 400));
        }

        if (language !== "en" && language !== "de") {
            return next(new AppError(`Incorrect language given`, 400));
        }
        await userService.resetPassword(userId, language, token, password, req);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const sendVerificationEmail = async function (req, res, next) {
    const email = req.body.email;
    const language = req.body.language || "de";

    try {
        if (!email) {
            return next(new AppError(`email_not_present`, 400));
        }

        if (language !== "en" && language !== "de") {
            return next(new AppError(`Incorrect language given`, 400));
        }
        await userService.sendVerificationEmail(email, language);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const verifyEmail = async function (req, res, next) {
    const userId = req.body.userId;
    const language = req.body.language || "de";
    const token = req.body.token;

    try {
        if (!userId) {
            return next(new AppError(`username_not_present`, 400));
        }

        if (!token) {
            return next(new AppError(`token_not_present`, 400));
        }

        if (language !== "en" && language !== "de") {
            return next(new AppError(`Incorrect language given`, 400));
        }

        const message = await userService.verifyEmail(userId, token, language);
        return res.status(200).json({
            status: "success",
            message,
        });
    } catch (err) {
        return next(err);
    }
};

const logout = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const refreshToken = req.body.refreshToken;
    const deviceToken = req.body.deviceId || req.body.accesToken;

    try {
        if (userId !== parseInt(req.userId)) {
            throw new AppError(`access_denied`, 403);
        }
        if (!req.body.refreshToken) {
            throw new AppError(`refresh_token_missing`, 403);
        }

        await userService.logout(userId, refreshToken, deviceToken);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const getUsers = async function (req, res, next) {
    const userName = req.query.username;
    const reqUserId = parseInt(req.userId);
    try {
        let userIds;
        if (req.query.ids) {
            const ids = req.query.ids.split(",").map((id) => parseInt(id));
            if (ids && ids.length > 10) {
                throw new AppError("You can only fetch upto 10 users", 400);
            }
            userIds = ids;
        }

        const users = await userService.getUsers(userIds, userName, reqUserId);
        res.status(200).json({
            status: "success",
            data: users,
        });
    } catch (err) {
        return next(err);
    }
};

const listLoginDevices = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const refreshToken = req.body.refreshToken;

    try {
        if (userId !== req.userId) {
            throw new AppError("access_denied", 401);
        }
        const tokens = await userService.listLoginDevices(userId, refreshToken);
        res.status(200).json({
            status: "success",
            data: tokens,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteLoginDevices = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const id = req.query.id;
    if (userId !== req.userId) {
        return next(new AppError("access_denied", 401));
    }
    try {
        await userService.deleteLoginDevices(userId, id);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const uploadUserProfileImage = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(Number(id)) || Number(id) <= 0) {
            throw new AppError(`invalid_user_id`, 400, undefined, { id });
        }
        if (id !== parseInt(req.userId)) {
            throw new AppError(`access_denied`, 403);
        }

        const { image } = req.files;
        if (!image) {
            throw new AppError(`image_not_uploaded`, 400);
        }

        const updationData = await userService.uploadUserProfileImage(
            id,
            image
        );
        if (updationData) {
            return res.status(200).json({
                status: "success",
                data: updationData,
            });
        } else {
            return res.status(500).json({
                status: "Failed!! Please try again",
            });
        }
    } catch (err) {
        return next(err);
    }
};

const deleteUserProfileImage = async function (req, res, next) {
    const id = req.params.id;
    const userId = parseInt(req.userId);
    try {
        if (isNaN(Number(id)) || Number(id) <= 0) {
            throw new AppError(`invalid_user_id`, 400, undefined, { id });
        }
        if (parseInt(id) !== userId) {
            throw new AppError(`access_denied`, 403);
        }
        await userService.deleteUserProfileImage(id);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const getUserListings = async function (req, res, next) {
    try {
        const userId = req.params.id;
        const pageNo = req.query.pageNo || 1;
        const pageSize = req.query.pageSize || 9;
        const categoryId = req.query.categoryId;
        const statusId = req.query.statusId;
        const subcategoryId = req.query.subcategoryId;
        const listings = await userService.getUserListings(
            userId,
            pageNo,
            pageSize,
            statusId,
            categoryId,
            subcategoryId
        );
        listings.forEach((listing) => delete listing.viewCount);
        return res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        return next(err);
    }
};

const getMyListings = async function (req, res, next) {
    try {
        const userId = req.userId;
        const pageNo = req.query.pageNo || 1;
        const pageSize = req.query.pageSize || 9;
        const categoryId = req.query.categoryId;
        const statusId = req.query.statusId;
        const subcategoryId = req.query.subcategoryId;

        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 400, undefined, {
                id: userId,
            });
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
        const data = await userService.getUserListings(
            userId,
            pageNo,
            pageSize,
            statusId,
            categoryId,
            subcategoryId,
            req.roleId,
            req.userId
        );
        if (data) {
            if (
                !process.env.IS_LISTING_VIEW_COUNT ||
                process.env.IS_LISTING_VIEW_COUNT === "False"
            ) {
                data.forEach((listing) => delete listing.viewCount);
            }
            return res.status(200).json({
                status: "success",
                data,
            });
        }
        return res.status(200).json({
            status: "success",
            data: [],
        });
    } catch (err) {
        return next(err);
    }
};

const deleteUser = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const requesterUserId = parseInt(req.userId);
    const requesterRoleId = req.roleId;

    try {
        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 404, undefined, {
                id: userId,
            });
        }

        // Allow user to delete themselves OR admin to delete other users (but not themselves)
        const isOwnAccount = userId === requesterUserId;
        const isAdmin = requesterRoleId === roles.Admin;

        if (isAdmin && isOwnAccount) {
            throw new AppError(`admin_cannot_delete_self`, 403);
        }

        if (!isOwnAccount && !isAdmin) {
            throw new AppError(`access_denied`, 403);
        }

        await userService.deleteUser(userId);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const storeFirebaseUserToken = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const token = req.body.token;
    const deviceToken = req.body.deviceId;

    try {
        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 404, undefined, {
                id: userId,
            });
        }
        if (userId !== req.userId) {
            throw new AppError(`access_denied`, 403);
        }
        if (!token) {
            throw new AppError(`missing_firebase_token`, 400);
        }
        if (!deviceToken) {
            throw new AppError(`missing_device_id`, 400);
        }
        await userService.storeFirebaseUserToken(userId, token, deviceToken);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const updateAllNotifications = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const notificationStatus = req.body.enabled;
    try {
        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 404, undefined, {
                id: userId,
            });
        }
        if (userId !== req.userId) {
            throw new AppError(`access_denied`, 403);
        }
        const resp = await notificationService.updateAllNotifications(
            userId,
            notificationStatus
        );
        res.status(200).json({
            status: "success",
            data: resp.message,
        });
    } catch (err) {
        return next(err);
    }
};

const getUserNotificationPreference = async function (req, res, next) {
    const userId = parseInt(req.params.id);

    try {
        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 404, undefined, {
                id: userId,
            });
        }
        if (userId !== req.userId) {
            throw new AppError(`access_denied`, 403);
        }
        const notificationPreference =
            await notificationService.getUserNotificationPreference(userId);
        res.status(200).json({
            status: "success",
            data: notificationPreference,
        });
    } catch (err) {
        return next(err);
    }
};

const updateUserNotificationPreference = async function (req, res, next) {
    const userId = parseInt(req.params.id);
    const preferences = req.body;

    try {
        if (isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new AppError(`invalid_user_id`, 404, undefined, {
                id: userId,
            });
        }
        if (userId !== req.userId) {
            throw new AppError(`access_denied`, 403);
        }
        const response =
            await notificationService.updateUserNotificationPreference(
                userId,
                preferences
            );
        res.status(200).json({
            status: "success",
            data: response.message,
        });
    } catch (err) {
        return next(err);
    }
};

const blockUser = async function (req, res, next) {
    try {
        const userId = req.userId;
        const roleId = req.roleId;
        const targetUserId = req.params.id;

        const result = await userService.blockUser(
            userId,
            roleId,
            targetUserId
        );
        res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

const unblockUser = async function (req, res, next) {
    try {
        const userId = req.userId;
        const roleId = req.roleId;
        const targetUserId = req.params.id;

        const result = await userService.unblockUser(
            userId,
            roleId,
            targetUserId
        );
        res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

const checkTermsAndCondition = async function (req, res, next) {
    const userId = parseInt(req.params.userId);

    try {
        const result = await userService.checkTermsAndCondition(userId);
        console.log("result", result);
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

const acceptTermsAndCondition = async function (req, res, next) {
    const policyVersion = req.body.policyVersion;
    const userId = parseInt(req.params.userId);

    try {
        if (!policyVersion) {
            throw new AppError("Policy version is required", 400);
        }
        if (!userId) {
            throw new AppError("User ID is required", 400);
        }

        const result = await userService.acceptTermsAndCondition(userId, policyVersion);
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
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
    getMyListings,
    storeFirebaseUserToken,
    updateAllNotifications,
    getUserNotificationPreference,
    updateUserNotificationPreference,
    blockUser,
    unblockUser,
    checkTermsAndCondition,
    acceptTermsAndCondition,
};
