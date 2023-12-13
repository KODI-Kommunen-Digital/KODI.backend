const express = require("express");
const router = express.Router();
const { getMoreInfo } = require("../controllers/moreInfoController");

router.get("/", getMoreInfo);

module.exports = router;
