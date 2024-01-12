const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const cityListingController = require("../services/cityListings");

// const radiusSearch = require('../services/handler')

router.get("/", cityListingController.getAllCityListings);

router.get("/:id", cityListingController.getCityListingWithId);

router.post("/", authentication, cityListingController.createCityListing);

router.patch("/:id", authentication, cityListingController.updateCityListing);

router.delete("/:id", authentication, cityListingController.deleteCityListing);

router.post("/:id/imageUpload", authentication, cityListingController.uploadImageForCityListing);

router.post("/:id/pdfUpload", authentication, cityListingController.uploadPDFForCityListing);

router.delete("/:id/imageDelete", authentication, cityListingController.deleteImageForCityListing);

router.delete("/:id/pdfDelete", authentication, cityListingController.deletePDFForCityListing);


module.exports = router;
