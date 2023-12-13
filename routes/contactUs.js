const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const { contactUs } = require("../controllers/contactUsController");

router.post("/",authentication,contactUs)
module.exports = router;
