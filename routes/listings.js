const express = require("express");
const router = express.Router();
const { getAllListings } = require("../controllers/listingController");

router.get("/", getAllListings);

module.exports = router;