const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const axios = require("axios");
const parser = require("xml-js");
const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const { register, login, getUserById, updateUser, refreshAuthToken, forgotPassword, resetPassword, sendVerificationEmail, verifyEmail, logout, getUsers, listLoginDevices, deleteLoginDevices, uploadUserProfileImage, deleteUserProfileImage, getUserListings } = require("../controllers/userController");

router.post("/login", login);

router.post("/register", register);

router.get("/:id", getUserById);

router.patch("/:id", authentication, updateUser);

router.delete("/:id", authentication, async function (req, res, next) {
    const id = parseInt(req.params.id);

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    if (id !== req.userId) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    try {
        let response = await database.get(tables.USER_TABLE, { id });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }

        response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
            userId: id,
        });
        const cityUsers = response.rows;

        let imageList = await axios.get(
            "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST
        );
        imageList = JSON.parse(
            parser.xml2json(imageList.data, { compact: true, spaces: 4 })
        );
        const userImageList = imageList.ListBucketResult.Contents.filter(
            (obj) => obj.Key._text.includes("user_" + id)
        );

        const onSucccess = async () => {
            for (const cityUser of cityUsers) {
                await database.deleteData(
                    tables.LISTINGS_TABLE,
                    { userId: cityUser.cityUserId },
                    cityUser.cityId
                );
                await database.deleteData(
                    tables.USER_TABLE,
                    { id: cityUser.cityUserId },
                    cityUser.cityId
                );
            }
            await database.deleteData(tables.USER_CITYUSER_MAPPING_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.USER_LISTING_MAPPING_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
                userId: id,
            });
            await database.deleteData(tables.FAVORITES_TABLE, { userId: id });
            await database.deleteData(tables.USER_TABLE, { id });

            return res.status(200).json({
                status: "success",
            });
        };

        const onFail = (err) => {
            return next(
                new AppError("Image Delete failed with Error Code: " + err)
            );
        };
        await imageDeleteMultiple(
            userImageList.map((image) => ({ Key: image.Key._text })),
            onSucccess,
            onFail
        );
    } catch (err) {
        return next(new AppError(err));
    }
});



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
