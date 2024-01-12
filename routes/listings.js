const express = require("express");
const router = express.Router();
const { getAllListings } = require("../services/listings");

router.get("/", getAllListings);

module.exports = router;