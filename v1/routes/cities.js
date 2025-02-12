const express = require("express");
const router = express.Router();
const { getCities } = require("../controllers/cities");

router.get("/", getCities);

module.exports = router;
