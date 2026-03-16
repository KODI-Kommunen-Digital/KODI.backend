const express = require("express");
const router = express.Router();
const { getCities } = require("../v2/controllers/cities");

router.get("/", getCities);

module.exports = router;
