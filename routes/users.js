const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const { register, login, getUserById, updateUser, refreshAuthToken, forgotPassword, resetPassword, sendVerificationEmail, verifyEmail, logout, getUsers, listLoginDevices, deleteLoginDevices, uploadUserProfileImage, deleteUserProfileImage, getUserListings, deleteUser } = require("../controllers/users");

router.post("/login", login);

router.post("/register", register);

router.get("/:id", getUserById);

router.patch("/:id", authentication, updateUser);

router.delete("/:id", authentication, deleteUser);



router.delete("/:id/imageDelete", authentication, deleteUserProfileImage);

router.post("/:id/imageUpload", authentication, uploadUserProfileImage);

router.get("/:id/listings", getUserListings);

router.post("/:id/refresh", refreshAuthToken);

router.post("/forgotPassword", forgotPassword);

router.post("/resetPassword", resetPassword);

router.post("/sendVerificationEmail", sendVerificationEmail);

router.post("/verifyEmail", verifyEmail);

router.post("/:id/logout", authentication, logout);

router.get("/", getUsers);

router.post("/:id/loginDevices", authentication, listLoginDevices);

router.delete("/:id/loginDevices", authentication, deleteLoginDevices);

module.exports = router;
