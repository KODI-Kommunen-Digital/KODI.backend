const express = require("express");
const router = express.Router();
const { getAllStatuses } = require("../v2/controllers/statuses");

router.get("/", getAllStatuses);

module.exports = router;
