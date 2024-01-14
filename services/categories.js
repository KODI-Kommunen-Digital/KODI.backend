const categoryRepo = require("../repository/category");
const cityRepo = require("../repository/cities");
const AppError = require("../utils/appError");

const getAllCategories = async function (req, res, next) {
    try {
        return await categoryRepo.getCategories();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const getListingCount = async function (cityId) {
    if (cityId) {
        try {
            const response = await cityRepo.getCities({ id: cityId });
            if (response.length === 0) {
                throw new AppError(`Invalid City '${cityId}' given`, 404);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        const response = await categoryRepo.getCategoryListingCountForCity(cityId);
        return response;
    } else {
        try {
            const response = await categoryRepo.getCategoryListingCount();
            return response;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
}

const getSubCategories = async function (categoryId) {
    try {
        return await categoryRepo.getSubCategoriesForCategoryId(categoryId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

module.exports = {
    getAllCategories,
    getListingCount,
    getSubCategories,
}