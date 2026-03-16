const express = require("express");
const { getVillages } = require("../v2/controllers/villages");
const router = express.Router();

router.get("/", getVillages);

module.exports = router;
