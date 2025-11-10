const cityService = require("../services/cities");
const roles = require("../constants/roles");
const AppError = require("../utils/appError");

const getCities = async function (req, res, next) {
    let hasForum = false;
    if (req.query.hasForum) {
        hasForum = true;
    }
    try {
        const data = await cityService.getCities(hasForum);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const citiesListingsByUserId = async function (req, res, next) {
    const UserId = parseInt(req.params.UserId);
    const pageNo = req.query.pageNo;
    const pageSize = req.query.pageSize;
    const searchQuery = req.query.searchQuery;
    const orderBy = req.query.orderBy;
    const isDescending = req.query.isDescending === "true" ? true : false;
    try {
        // Allow access if:
        // 1. User is requesting their own data
        // 2. User is an Admin
        // 3. User is a Moderator (will be filtered by cities they moderate)
        if (
            UserId &&
            req.roleId &&
            (req.userId === UserId ||
                req.roleId === roles.Admin ||
                req.roleId === roles.Moderator)
        ) {
            // eslint-disable-line
            const data = await cityService.citiesListingsByUserId(
                UserId,
                req.userId == UserId && req.roleId === roles.Admin, // eslint-disable-line
                pageNo,
                pageSize,
                searchQuery,
                orderBy,
                isDescending,
                req.roleId === roles.Moderator ? req.userId : null // Pass moderator's ID if the user is a moderator
            );
            return res.status(200).json({
                status: "success",
                data,
            });
        } else {
            throw new AppError(`Access denied`, 401);
        }
    } catch (err) {
        return next(err);
    }
};

const getCityById = async function (req, res, next) {
    try {
        const data = await cityService.getCityById(req.params.id);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const getCityAdmins = async function (req, res, next) {
    const cityId = Number(req.params.id);

    const roleId = req.roleId;

    const pageNo = Number(req.query.pageNo ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);
    const searchQuery = req.query.searchQuery ?? "";
    try {
        const data = await cityService.getCityAdmins(
            pageNo,
            pageSize,
            roleId,
            cityId,
            searchQuery
        );
        res.status(200).json({
            status: "success",
            data: data.data,
            count: data.count,
        });
    } catch (err) {
        return next(err);
    }
};

const addCityAdmin = async function (req, res, next) {
    const cityId = Number(req.params.id);
    const roleId = req.roleId;
    const { userId } = req.body;

    try {
        await cityService.createCityAdmin(roleId, cityId, userId);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const removeCityAdmin = async function (req, res, next) {
    const cityId = Number(req.params.id);
    const roleId = req.roleId;
    const { userId } = req.body;

    try {
        await cityService.deleteCityAdmin(roleId, cityId, userId);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const createCity = async (req, res, next) => {
    try {
        const data = await cityService.createCity(req.roleId, req.body);
        res.status(201).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateCity = async (req, res, next) => {
    try {
        const data = await cityService.updateCity(
            req.roleId,
            req.params.id,
            req.body
        );
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteCity = async (req, res, next) => {
    try {
        const response = await cityService.deleteCity(
            req.roleId,
            req.params.id
        );
        console.log(response);
        res.status(204).json({
            status: "success",
            response,
        });
    } catch (err) {
        return next(err);
    }
};

const uploadImage = async function (req, res, next) {
    const cityId = req.params.id;
    const roleId = req.roleId;
    const imageFiles = req?.files?.image;
    try {
        await cityService.uploadImage(cityId, roleId, imageFiles);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deleteImage = async function (req, res, next) {
    const cityId = req.params.id;
    const roleId = req.roleId;

    try {
        await cityService.deleteImage(cityId, roleId);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getCities,
    createCity,
    updateCity,
    deleteCity,
    uploadImage,
    deleteImage,
    getCityById,
    getCityAdmins,
    addCityAdmin,
    removeCityAdmin,
    citiesListingsByUserId,
};
