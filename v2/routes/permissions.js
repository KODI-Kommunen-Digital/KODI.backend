const express = require("express");
const router = express.Router();
const { getAllPermissions } = require("../controllers/permissions");

router.get("/", getAllPermissions);

module.exports = router;
