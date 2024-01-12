const categoryRepo = require("../repository/category");
const cityRepo = require("../repository/cities");
const AppError = require("../utils/appError");

const getAllCategories = async function (req, res, next) {
    try {
        const data = await categoryRepo.getCategories()
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

const getListingCount = async function (req, res, next) {
    const params = req.query;

    if (params.cityId) {
        try {
            const response = await cityRepo.getCities({ id: params.cityId });
            if (response.length === 0) {
                return next(
                    new AppError(`Invalid City '${params.cityId}' given`, 404)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        const response = await categoryRepo.getCategoryListingCountForCity(params.cityId);
        res.status(200).json({
            status: "success",
            data: response
        });
    } else {
        try {
            const response = await categoryRepo.getCategoryListingCount();
            res.status(200).json({
                status: "success",
                data: response
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
}

const getSubCategories = async function (req, res, next) {
    const categoryId = req.params.id;
    try {
        const data = await categoryRepo.getSubCategoriesForCategoryId(categoryId);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

module.exports = {
    getAllCategories,
    getListingCount,
    getSubCategories,
}