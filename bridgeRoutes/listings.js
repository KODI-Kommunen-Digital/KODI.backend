const express = require("express");
const router = express.Router();
const authentication = require("../v2/middlewares/authentication");
const optionalAuthentication = require("../v2/middlewares/optionalAuthentication");
const {
    getAllListings,
    searchListings,
    createListing,
} = require("../v2/controllers/listings");

router.get("/", optionalAuthentication, getAllListings);

router.get("/search", searchListings);

router.post("/", authentication, createListing);

module.exports = router;
