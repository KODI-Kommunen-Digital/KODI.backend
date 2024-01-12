const express = require("express");
const { getVillages } = require("../services/villages");
const router = express.Router();

router.get("/", getVillages);

module.exports = router;
