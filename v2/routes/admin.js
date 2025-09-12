const express = require("express");
const router = express.Router();
const {
    register,
    userListings,
    userListingsById
} = require("../controllers/admin");
const authentication = require("../middlewares/authentication");

const filterNonPostRequests = (req, res, next) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed"); // Return 405 Method Not Allowed for non-POST requests
    }
    next(); // Proceed to the next middleware
};

router.use("/register", filterNonPostRequests);

router.post("/register", authentication, register);
router.get("/userlistings", authentication, userListings);
router.get("/userlistings/:UserId", authentication, userListingsById);


module.exports = router;
