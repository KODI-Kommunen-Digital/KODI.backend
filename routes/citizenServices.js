const express = require("express");
const router = express.Router();
const { getCitizenServices, getDigitalManagementServices } = require("../services/citizenService");

router.get("/", getCitizenServices);

router.get("/digitalManagement", getDigitalManagementServices);

module.exports = router;
