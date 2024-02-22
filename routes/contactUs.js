const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const { contactUs } = require("../controllers/contactUs");

router.post("/", authentication, contactUs)
module.exports = router;
