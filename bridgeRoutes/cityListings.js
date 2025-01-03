const express = require("express");
const router = express.Router();
const authentication = require("../v2/middlewares/authentication");
const optionalAuthentication = require("../v2/middlewares/optionalAuthentication");
const listingController = require("../v2/controllers/listings");
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

router.get("/", optionalAuthentication, listingController.getAllListings);

router.get("/:id", rateLogger, listingController.getListingWithId);

router.post("/", authentication, listingController.createListing);

router.patch("/:id", authentication, listingController.updateListing);

router.delete("/:id", authentication, listingController.deleteListing);

router.post(
    "/:id/imageUpload",
    authentication,
    listingController.uploadImage,
);

router.post("/:id/vote", listingController.vote);

router.post(
    "/:id/pdfUpload",
    authentication,
    listingController.uploadPDF,
);

router.delete(
    "/:id/imageDelete",
    authentication,
    listingController.deleteImage,
);

router.delete(
    "/:id/pdfDelete",
    authentication,
    listingController.deletePDF,
);

module.exports = router;
