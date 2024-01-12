const express = require("express");
const router = express.Router();
const { getMoreInfo } = require("../services/moreInfos");

router.get("/", getMoreInfo);

module.exports = router;
