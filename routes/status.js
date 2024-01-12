const express = require("express");
const router = express.Router();
const { getAllStatuses } = require("../services/statuses");

router.get("/", getAllStatuses);

module.exports = router;
