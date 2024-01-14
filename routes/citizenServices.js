const express = require("express");
const router = express.Router();
const { getCitizenServices, getDigitalManagementServices } = require("../controllers/citizenService");

router.get("/", getCitizenServices);

router.get("/digitalManagement", getDigitalManagementServices);

module.exports = router;
