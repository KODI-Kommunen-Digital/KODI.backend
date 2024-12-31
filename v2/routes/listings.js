const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const optionalAuthentication = require("../middlewares/optionalAuthentication");
const {
    getAllListings,
    searchListings,
    createListing,
    updateListing,
    getListingWithId,
    deleteListing,
    uploadImage,
    uploadPDF,
    deleteImage,
    deletePDF
} = require("../controllers/listings");
const rateLimit = require("express-rate-limit");

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

router.get("/:id", rateLogger, getListingWithId);

router.get("/", optionalAuthentication, getAllListings);

router.get("/search", searchListings);

router.post("/", authentication, createListing);

router.delete("/:id", authentication, deleteListing);

router.patch("/:listingId", authentication, updateListing);

router.delete("/:listingId", authentication, deleteListing);

router.post(
    "/:id/imageUpload",
    authentication,
    uploadImage,
);

router.post(
    "/:id/pdfUpload",
    authentication,
    uploadPDF,
);

router.delete(
    "/:id/imageDelete",
    authentication,
    deleteImage,
);

router.delete(
    "/:id/pdfDelete",
    authentication,
    deletePDF,
);

module.exports = router;
