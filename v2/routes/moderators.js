const express = require("express");
const router = express.Router();
const { createModerators, updateModerator, deleteModerators, listModeratorsForRequester, getModeratorProfile } = require("../controllers/moderators");
const authentication = require("../middlewares/authentication");

router.post("/", authentication, createModerators);
router.put("/", authentication, updateModerator);
router.delete("/", authentication, deleteModerators);
router.get("/my", authentication, listModeratorsForRequester);
router.get("/:userId/profile", authentication, getModeratorProfile);

module.exports = router;


