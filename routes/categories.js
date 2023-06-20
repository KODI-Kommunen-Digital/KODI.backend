const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/", async function (req, res, next) {
  database
    .get(tables.CATEGORIES_TABLE)
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
