const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const { getAllCategories, getListingCount } = require("../controllers/categoriesController");

router.get("/", getAllCategories);

router.get("/listingsCount", getListingCount);

router.get("/:id/subcategories", async function (req, res, next) {
    const categoryId = req.params.id;
    database
        .get(tables.SUBCATEGORIES_TABLE, { categoryId })
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        }).catch((err) => {
            return next(new AppError(err));
        });
});

module.exports = router;
