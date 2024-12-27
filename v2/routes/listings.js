const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const optionalAuthentication = require("../middlewares/optionalAuthentication");
const {
    getAllListings,
    searchListings,
    createListing,
    updateListing,
} = require("../controllers/listings");

router.get("/", optionalAuthentication, getAllListings);

router.get("/search", searchListings);

router.post("/", authentication, createListing);

router.patch("/:listingId", authentication, updateListing);

module.exports = router;
