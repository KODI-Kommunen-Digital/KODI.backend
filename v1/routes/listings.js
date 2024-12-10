const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const {
    getAllListings,
    searchListings,
    createListing,
} = require("../controllers/listings");

router.get("/", getAllListings);

router.get("/search", searchListings);

router.post("/", authentication, createListing);

module.exports = router;
