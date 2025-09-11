const express = require("express");
const router = express.Router();
const {
    getCities,
    createCity,
    updateCity,
    deleteCity,
    uploadImage,
    // deleteImage
} = require("../controllers/cities");
const authentication = require("../middlewares/authentication");

router.get("/", getCities);
router.post("/", authentication, createCity);
router.put("/:id", authentication, updateCity);
router.delete("/:id", authentication, deleteCity);

router.post(
    "/:id/imageUpload",
    authentication,
    uploadImage,
);

// router.delete(
//     "/:id/imageDelete",
//     authentication,
//     deleteImage,
// );

module.exports = router;
