const express = require("express");
const router = express.Router();
const {
    getCities,
    createCity,
    updateCity,
    deleteCity,
    uploadImage,
    getCityById,
    getCityAdmins,
    addCityAdmin,
    removeCityAdmin,
    citiesListingsByUserId
    // deleteImage
} = require("../controllers/cities");
const authentication = require("../middlewares/authentication");

router.get("/", getCities);
router.post("/", authentication, createCity);
router.put("/:id", authentication, updateCity);
router.delete("/:id", authentication, deleteCity);
router.get("/:id", getCityById);

router.get("/:id/admins", authentication, getCityAdmins);
router.post("/:id/admins", authentication, addCityAdmin);
router.delete("/:id/admins", authentication, removeCityAdmin);

// // Get Cities For city Admin
router.get("/:UserId/cityAdmin", authentication, citiesListingsByUserId);

router.post(
    "/:id/image",
    authentication,
    uploadImage,
);

// router.delete(
//     "/:id/imageDelete",
//     authentication,
//     deleteImage,
// );

module.exports = router;
