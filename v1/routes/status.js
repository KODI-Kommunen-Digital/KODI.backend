const express = require("express");
const router = express.Router();
const { getAllStatuses } = require("../controllers/statuses");

router.get("/", getAllStatuses);

module.exports = router;
