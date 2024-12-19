const express = require("express");
const router = express.Router();
const adsController = require("../controllers/ads");

router.get("/", adsController.getRandomAds);
router.get("/list", adsController.getAdLists);

module.exports = router;
