const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const { getAllFavoritesForUser, getFavoriteListingsForUser, addNewFavoriteForUser, deleteFavoriteListingForUser } = require("../controllers/favoritesController");

// To get the favorite ID  of a user
router.get("/", authentication, getAllFavoritesForUser);
// To get all the listings from the favorite table
router.get("/listings", authentication, getFavoriteListingsForUser);

// To insert or add  a listing into favorite table
router.post("/", authentication, addNewFavoriteForUser);

// To delete  a favorite listing from favorite table
router.delete("/:id", authentication, deleteFavoriteListingForUser);
module.exports = router;
