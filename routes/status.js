const express = require("express");
const router = express.Router();
const { getAllStatuses } = require("../controllers/statusController");

router.get("/", getAllStatuses);

module.exports = router;
