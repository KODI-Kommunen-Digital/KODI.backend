const express = require("express");
const router = express.Router();
const { getMoreInfo } = require("../v2/controllers/moreInfos");

router.get("/", getMoreInfo);

module.exports = router;
