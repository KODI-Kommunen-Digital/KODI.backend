const express = require("express");
const router = express.Router();
const { getCities } = require("../services/cities");


router.get("/", getCities);

module.exports = router;
