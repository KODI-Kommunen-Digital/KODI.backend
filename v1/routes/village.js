const express = require("express");
const { getVillages } = require("../controllers/villages");
const router = express.Router();

router.get("/", getVillages);

module.exports = router;
