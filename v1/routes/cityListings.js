const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const cityListingController = require("../controllers/cityListings");
// const database = require("../services/database");
// const tables = require("../constants/tableNames");
// const categories = require("../constants/categories");
// const defaultImageCount = require("../constants/defaultImagesInBucketCount");
// const roles = require("../constants/roles");
// const supportedLanguages = require("../constants/supportedLanguages");
// const AppError = require("../utils/appError");
// const authentication = require("../middlewares/authentication");
// const deepl = require("deepl-node");
// const imageUpload = require("../utils/imageUpload");
// const pdfUpload = require("../utils/pdfUpload");
// const objectDelete = require("../utils/imageDelete");
// const getDateInFormate = require("../utils/getDateInFormate");
// const axios = require("axios");
// const parser = require("xml-js");
// const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
// const imageDeleteAsync = require("../utils/imageDeleteAsync");
// const getPdfImage = require("../utils/getPdfImage");
// const { createListing } = require('../services/listingFunctions');
const rateLimit = require("express-rate-limit");
// const createRateLimitMiddleware = require("./rateLimitMiddleware");

// const radiusSearch = require('../services/handler')

const rateLogger = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 1, // Max 1 request per 5 seconds
    handler: (req, res, next, options) => {
        console.log(`Repeated request detected from ${req.ip}.`);
        req.repeatedRequest = true;
        next(); // Proceed to the next middleware
    },
    standardHeaders: false, // Disable the RateLimit-* headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
    skipSuccessfulRequests: false, // Skip counting successful requests
});

router.get("/", cityListingController.getAllCityListings);

router.get("/:id", rateLogger, cityListingController.getCityListingWithId);

router.post("/", authentication, cityListingController.createCityListing);

router.patch("/:id", authentication, cityListingController.updateCityListing);

router.delete("/:id", authentication, cityListingController.deleteCityListing);

router.post(
    "/:id/imageUpload",
    authentication,
    cityListingController.uploadImageForCityListing,
);

router.post("/:id/vote", cityListingController.vote);

router.post(
    "/:id/pdfUpload",
    authentication,
    cityListingController.uploadPDFForCityListing,
);

router.delete(
    "/:id/imageDelete",
    authentication,
    cityListingController.deleteImageForCityListing,
);

router.delete(
    "/:id/pdfDelete",
    authentication,
    cityListingController.deletePDFForCityListing,
);

module.exports = router;
