const express = require("express");
const router = express.Router();
const { getMoreInfo } = require("../controllers/moreInfos");

router.get("/", getMoreInfo);

module.exports = router;
