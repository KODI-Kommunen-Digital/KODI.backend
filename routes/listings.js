const express = require("express");
const router = express.Router();
const { getAllListings } = require("../controllers/listings");

router.get("/", getAllListings);

module.exports = router;