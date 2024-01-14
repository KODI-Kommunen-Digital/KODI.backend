const categoryService = require("../services/categories");

const getAllCategories = async function (req, res, next) {
    try {
        const data = await categoryService.getAllCategories()
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
}

const getListingCount = async function (req, res, next) {
    const cityId = req.query.cityId;
    try{
        const data = await categoryService.getListingCount(cityId);
        res.status(200).json({
            status: "success",
            data,
        });
    }catch(err){
        return next(err);
    }
}

const getSubCategories = async function (req, res, next) {
    const categoryId = req.params.id;
    try {
        const data = await categoryService.getSubCategories(categoryId);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getAllCategories,
    getListingCount,
    getSubCategories,
}