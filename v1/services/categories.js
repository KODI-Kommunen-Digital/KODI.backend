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
};

const getListingCount = async function (cityId) {
    try {
        let cityIds = [];
        if (cityId) {
            const cityData = await cityRepo.getCityWithId(cityId);
            cityIds = [cityData.id];
        } else {
            const citiesData = await cityRepo.getCities(null, "id", ["id"]);
            cityIds = citiesData.map((cityData) => cityData.id);
        }
        return await categoryRepo.getCategoryListingCount(cityIds);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getSubCategories = async function (categoryId) {
    try {
        return await categoryRepo.getSubCategoriesForCategoryId(categoryId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getAllCategories,
    getListingCount,
    getSubCategories,
};
