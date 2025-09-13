const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const roles = require("../constants/roles");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const imageUpload = require("../utils/imageUpload");

router.get("/", async function (req, res, next) {
    const filter = {};
    if (req.query.hasForum) {
        filter.hasForum = true;
    }
    database
        .get(
            tables.CITIES_TABLE,
            filter,
            "id,name,image, hasForum",
            null,
            null,
            null,
            ["name"]
        )
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

// router.post("/:id/admins", addCityAdmin);
// router.delete("/:id/admins", removeCityAdmin);
// router.post("/:id/image", uploadCityImage);
// router.delete("/:id/image", deleteCityImage);

// add city admin for city
router.post("/:id/admins", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not authorized`, 401);
        }
        const cityId = Number(req.params.id);
        const roleId = req.roleId;
        const { userId } = req.body;
        if (!cityId || isNaN(cityId)) {
            throw new AppError(`City id is invalid`, 400);
        }
        if (!userId || isNaN(userId)) {
            throw new AppError(`User id is invalid`, 400);
        }

        // check if city exists
        const { rowCount: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id: cityId },
            "id"
        );
        if (cityCount === 0) {
            throw new AppError(`City does not exist`, 400);
        }

        // check if user exists in user table and is city admin
        const { rowCount: userCount, rows: userRows } = await database.get(
            tables.USER_TABLE,
            { id: userId, roleId: roles["City Admin"] },
            "id, email"
        );

        if (userCount === 0) {
            throw new AppError(
                `User does not exist or is not a city admin`,
                400
            );
        }

        const email = userRows[0].email;

        // check if user is already admin for the city
        const { rowCount: cityAdminCount } = await database.get(
            tables.CITY_USER_ROLES_TABLE,
            { cityId, userId },
            "id"
        );
        if (cityAdminCount > 0) {
            throw new AppError(`User is already an admin for the city`, 400);
        }

        // add user as city admin
        await database.insert(tables.CITY_USER_ROLES_TABLE, {
            cityId,
            userId,
            roleId
        });

        res.status(200).json({
            status: "success",
            message: `User with email ${email} added as city admin successfully`
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:id/admins", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not authorized`, 401);
        }
        const cityId = Number(req.params.id);
        const { userId } = req.body;
        if (!cityId || isNaN(cityId)) {
            throw new AppError(`City id is invalid`, 400);
        }
        if (!userId || isNaN(userId)) {
            throw new AppError(`User id is invalid`, 400);
        }

        // check if city exists
        const { rowCount: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id: cityId },
            "id"
        );
        if (cityCount === 0) {
            throw new AppError(`City does not exist`, 400);
        }

        // check if user exists in user table and is city admin
        const { rowCount: userCount, rows: userRows } = await database.get(
            tables.USER_TABLE,
            { id: userId, roleId: roles["City Admin"] },
            "id, email"
        );

        if (userCount === 0) {
            throw new AppError(
                `User does not exist or is not a city admin`,
                400
            );
        }

        const email = userRows[0].email;

        // check if user is already admin for the city
        const { rowCount: cityAdminCount } = await database.get(
            tables.CITY_USER_ROLES_TABLE,
            { cityId, userId },
            "id"
        );
        if (cityAdminCount === 0) {
            throw new AppError(`User is not an admin for the city`, 400);
        }

        // remove user as city admin
        await database.delete(tables.CITY_USER_ROLES_TABLE, { cityId, userId });

        res.status(200).json({
            status: "success",
            message: `User with email ${email} removed as city admin successfully`
        });
    } catch (error) {
        next(error);
    }
});

router.post("/:id/image", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin && req.roleId !== roles["City Admin"]) {
            throw new AppError(`Not authorized`, 401);
        }
        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
            throw new AppError(`City id is invalid`, 400);
        }
        // check if city exists
        const { rowCount: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id },
            "id"
        );
        if (cityCount === 0) {
            throw new AppError(`City does not exist`, 400);
        }
        const image = req.files ? req.files.image : null;
        if (!image) {
            throw new AppError(`Image is required`, 400);
        }

        // upload city image logic here
        const imagePath = await imageUpload(image, `cities/${id}.jpg`);
        await database.update(
            tables.CITIES_TABLE,
            { id },
            { image: imagePath }
        );
        res.status(200).json({
            status: "success",
            message: `City image uploaded successfully`
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:id/image", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin && req.roleId !== roles["City Admin"]) {
            throw new AppError(`Not authorized`, 401);
        }
        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
            throw new AppError(`City id is invalid`, 400);
        }
        // check if city exists
        const { rowCount: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id },
            "id"
        );
        if (cityCount === 0) {
            throw new AppError(`City does not exist`, 400);
        }

        // delete city image logic here
        await imageDeleteAsync.deleteImage(`cities/${id}.jpg`);
        await database.update(
            tables.CITIES_TABLE,
            { id },
            { image: null }
        );

        res.status(200).json({
            status: "success",
            message: `City image deleted successfully`
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
