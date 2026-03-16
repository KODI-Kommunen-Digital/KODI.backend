const express = require("express");
const router = express.Router();
const authentication = require("../v2/middlewares/authentication");
const { contactUs } = require("../v2/controllers/contactUs");

router.post("/", authentication, contactUs);
module.exports = router;
