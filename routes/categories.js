const express = require("express");
const router = express.Router();
const { getAllCategories, getListingCount, getSubCategories } = require("../controllers/categoriesController");

router.get("/", getAllCategories);

router.get("/listingsCount", getListingCount);

router.get("/:id/subcategories", getSubCategories);

module.exports = router;
