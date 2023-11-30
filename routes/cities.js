const express = require("express");
const router = express.Router();
const { getCities } = require("../controllers/cityController");

router.get("/", getCities);

module.exports = router;
