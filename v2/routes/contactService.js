const express = require("express");
const router = express.Router();
const { contactService } = require("../controllers/contactService");

router.post("/", contactService);
module.exports = router;
