const { getCategories } = require("../services/categoryService");
const AppError = require("../utils/appError");

const getAllCategories = async function (req, res, next) {
    try {
        const data = await getCategories()
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
}