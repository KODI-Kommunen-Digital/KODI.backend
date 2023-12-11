const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const roles = require("../constants/roles");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const objectDelete = require("../utils/imageDelete");
const cityListingController = require("../controllers/cityListings");

// const radiusSearch = require('../services/handler')

router.get("/", cityListingController.getAllCityListings);

router.get("/:id", cityListingController.getCityListingWithId);

router.post("/", authentication, cityListingController.createCityListing);

router.patch("/:id", authentication, cityListingController.updateCityListing);

router.delete("/:id", authentication, async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid entry ${id}`, 404));
        return;
    }

    try {
        const response = await database.get(tables.CITIES_TABLE, {
            id: cityId,
        });
        if (response.rows && response.rows.length === 0) {
            return next(
                new AppError(`Invalid City '${cityId}' given`, 404)
            );
        }
    } catch (err) {
        return next(new AppError(err));
    }

    let response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);
    if (!response.rows || response.rows.length === 0) {
        return next(new AppError(`Listing with id ${id} does not exist`, 404));
    }

    const currentListingData = response.rows[0];

    response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId: req.userId, cityId },
        "cityUserId"
    );

    if (req.roleId !== roles.Admin && (!response.rows || response.rows.length === 0 || response.rows[0].cityUserId !== currentListingData.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    const onSucccess = async () => {
        database.deleteData(tables.LISTINGS_TABLE, { id }, cityId);
        return res.status(200).json({
            status: "success",
        });
    };
    const onFail = (err) => {
        return next(
            new AppError("Image Delete failed with Error Code: " + err)
        );
    };
    await objectDelete(currentListingData.logo, onSucccess, onFail);
});

router.post("/:id/imageUpload", authentication, cityListingController.uploadImageForCityListing);

router.post("/:id/pdfUpload", authentication, cityListingController.uploadPDFForCityListing);

router.delete("/:id/imageDelete", authentication, cityListingController.deleteImageForCityListing);

router.delete("/:id/pdfDelete", authentication, cityListingController.deletePDFForCityListing);


module.exports = router;
