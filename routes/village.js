const express = require("express");
const { getVillages } = require("../controllers/villageController");
const router = express.Router();

router.get("/", getVillages);

module.exports = router;
