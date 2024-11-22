// const categoryRepo = require("../repository/category");
// const cityRepo = require("../repository/cities");
const AppError = require("../utils/appError");
const categoriesRepository = require("../repository/categoriesRepo");
const cityRepository = require("../repository/citiesRepo");
const subcategoriesRepository = require("../repository/subcategoriesRepo");

const getAllCategories = async function (req, res, next) {
    try {
        // return await categoryRepo.getCategories();
        const categories = await categoriesRepository.getAll();
        res.status(200).json({
            status: "success",
            data: categories.rows,
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getListingCount = async function (cityId) {
    try {
        let cityIds = [];
        if (cityId) {
            // const cityData = await cityRepo.getCityWithId(cityId);
            const cityData = await cityRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: cityId,
                    },
                ],
            });
            cityIds = [cityData.id];
        } else {
            // const citiesData = await cityRepo.getCities(null, "id", ["id"]);
            const citiesResp = await cityRepository.getAll({
                columns: "id",
                orderBy: ["id"],
            });
            const citiesData = citiesResp.rows;
            cityIds = citiesData.map((cityData) => cityData.id);
        }
        // return await categoryRepo.getCategoryListingCount(cityIds);
        return await categoriesRepository.getCategoryListingCount(cityIds);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getSubCategories = async function (categoryId) {
    try {
        // return await categoryRepo.getSubCategoriesForCategoryId(categoryId);
        const subCategoryResponse = await subcategoriesRepository.getAll({
            filters: [
                {
                    key: "categoryId",
                    sign: "=",
                    value: categoryId,
                },
            ],
        });
        return subCategoryResponse.rows;
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
