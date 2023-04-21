const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/", async function (req, res, next) {
	const params = req.query;
	const cityId = req.cityId;
	database
		.get(tables.CATEGORIES_TABLE)
		.then((response) => {
			let data = response.rows;
			res.status(200).json({
				status: "success",
				data: data,
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});

router.get("/:id/subcategories", async function (req, res, next) {
	const categoryId = req.params.id;
	console.log("CatId", categoryId);
	database
		.get(tables.SUBCATEGORIES_TABLE, { categoryId })
		.then((response) => {
			let data = response.rows;
			res.status(200).json({
				status: "success",
				data: data,
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});

module.exports = router;
