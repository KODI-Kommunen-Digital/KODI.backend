const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const adminService = require("../services/admin");
const roles = require("../constants/roles");

const createConfig = async function (req, res, next) {
    const payload = { userId: req.userId, ...req.body };
    try {
        // if (req.roleId !== roles.Admin) {
        //     throw new AppError(`Not super admin user`, 401, errorCodes.USER_NOT_SUPER_ADMIN);
        // }
        const data = await adminService.createConfig(payload, req.headers['accept-language']);
        return res.status(200).json({
            status: "success",
            id: data.id,
        });
    } catch (err) {
        return next(err);
    }
};

const imageUpload = async function (req, res, next) {
    const payload = { userId: req.userId, files: req.files };
    try {
        // if (req.roleId !== roles.Admin) {
        //     throw new AppError(`Not super admin user`, 401, errorCodes.USER_NOT_SUPER_ADMIN);
        // }
        const fileName = await adminService.uploadImage(payload);
        return res.status(200).json({
            status: "success",
            fileName,
        });
    } catch (err) {
        return next(err);
    }
};

const register = async function (req, res, next) {
    const payload = req.body;

    try {
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not super admin user`, 401, errorCodes.USER_NOT_SUPER_ADMIN);
        }
        const id = await adminService.register(payload, req.headers['accept-language']);
        return res.status(200).json({
            status: "success",
            id,
        });
    } catch (err) {
        return next(err);
    }
};

const userListingsById = async function (req, res, next) {
    const UserId = req.params.UserId;
    try {
        if (req.roleId === roles.Admin) {
            const data = await adminService.userListingsById(UserId);
            return res.status(200).json({
                status: "success",
                data: data.rows,
            });
        }
        else {
            throw new AppError(`Not super admin user`, 401, errorCodes.ACCESS_DENIED);
        }

    } catch (err) {
        return next(err);
    }
};

const userListings = async function (req, res, next) {
    // add pagination with pageNo and pageSize
    const { pageNo = 1, pageSize = 10 } = req.query;
    try {
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not super admin user`, 401, errorCodes.USER_NOT_SUPER_ADMIN);
        }
        const data = await adminService.userListings(pageNo, pageSize);
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const configListing = async function (req, res, next) {
    try {
        // if (req.roleId !== roles.Admin) {
        //     throw new AppError(`Not super admin user`, 401, errorCodes.USER_NOT_SUPER_ADMIN);
        // }
        const data = await adminService.configListing();
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    register,
    userListings,
    createConfig,
    imageUpload,
    configListing,
    userListingsById
};
