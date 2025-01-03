const express = require("express");
const router = express.Router();
const {
    getCitizenServices,
    getCitizenServiceData,
} = require("../v2/controllers/citizenService");

router.get("/", getCitizenServices);

router.get("/citizenServiceData", getCitizenServiceData);

module.exports = router;
