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

router.get("/:id", async function (req, res, next) {
    const cityId = Number(req.params.id);
    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`City id is invalid`, 400));
    }
    database
        .get(
            tables.CITIES_TABLE,
            { id: cityId },
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
                data: data.length > 0 ? data[0] : {}
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.patch("/:id", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin && req.roleId !== roles["City Admin"]) {
            throw new AppError(`Not authorized`, 401);
        }
        const cityId = Number(req.params.id);
        const { name } = req.body;
        if (!cityId || isNaN(cityId)) {
            throw new AppError(`City id is invalid`, 400);
        }
        const updateData = {};
        if (name) updateData.name = name;
        await database.update(tables.CITIES_TABLE, updateData, { id: cityId });
        res.status(200).json({
            status: "success",
            message: `City updated successfully`
        });
    } catch (error) {
        next(error);
    }
});

router.get("/:id/admins", authentication, async function (req, res, next) {
    try {
        const { pageNo, pageSize, searchQuery } = req.query;
        if (!pageNo || isNaN(pageNo) || pageNo < 1) {
            throw new AppError(`Page number is invalid`, 400);
        }
        if (!pageSize || isNaN(pageSize) || pageSize < 1) {
            throw new AppError(`Page size is invalid`, 400);
        }   
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not authorized`, 401);
        }
        const cityId = Number(req.params.id);
        if (!cityId || isNaN(cityId)) {
            throw new AppError(`City id is invalid`, 400);
        }
        // check if city exists
        const { rows: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id: cityId },
            "id"
        );  

        if (cityCount.length === 0) {
            throw new AppError(`City does not exist`, 400);
        }
        const result = await getCityAdmins(Number(pageNo), Number(pageSize), cityId, searchQuery ? searchQuery : '');
        res.status(200).json({
            status: "success",
            data: result.data,
            count: result.count
        }); 
    } catch (error) {
        next(error);
    }
});

router.post("/:id/admins", authentication, async function (req, res, next) {
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
        const { rows: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id: cityId },
            "id"
        );
        if (cityCount.length === 0) {
            throw new AppError(`City does not exist`, 400);
        }

        // check if user exists in user table and is city admin
        const { rows: userRows } = await database.get(
            tables.USER_TABLE,
            { id: userId, roleId: roles["City Admin"] },
            "id, email"
        );

        if (userRows.length === 0) {
            throw new AppError(
                `User does not exist or is not a city admin`,
                400
            );
        }

        const email = userRows[0].email;

        // check if user is already admin for the city
        const { rows: cityAdminCount } = await database.get(
            tables.CITY_USER_ROLES_TABLE,
            { cityId, userId },
            "id"
        );
        if (cityAdminCount.length > 0) {
            throw new AppError(`User is already an admin for the city`, 400);
        }

        // add user as city admin
        await database.create(tables.CITY_USER_ROLES_TABLE, {
            cityId,
            userId,
            isAdmin: true
        });

        await database.update(
            tables.USER_TABLE,
            { id: userId },
            { roleId: roles["City Admin"] }
        );

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
        const { rows: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id: cityId },
            "id"
        );
        if (cityCount.length === 0) {
            throw new AppError(`City does not exist`, 400);
        }

        // check if user exists in user table and is city admin
        const { rows: userRows } = await database.get(
            tables.USER_TABLE,
            { id: userId, roleId: roles["City Admin"] },
            "id, email"
        );

        if (userRows.length === 0) {
            throw new AppError(
                `User does not exist or is not a city admin`,
                400
            );
        }

        const email = userRows[0].email;

        // check if user is already admin for the city
        const { rows: cityAdminCount } = await database.get(
            tables.CITY_USER_ROLES_TABLE,
            { cityId, userId },
            "id"
        );
        if (cityAdminCount.length === 0) {
            throw new AppError(`User is not an admin for the city`, 400);
        }

        // remove user as city admin
        await database.delete(tables.CITY_USER_ROLES_TABLE, { cityId, userId });

        // if user nnot admin for any other city, change role to normal user
        const { rows: otherCitiesCount } = await database.get(
            tables.CITY_USER_ROLES_TABLE,
            { userId },
            "id"
        );

        if (otherCitiesCount.length === 0) {
            await database.update(
                tables.USER_TABLE,
                { id: userId },
                { roleId: roles["Content Creator"] }
            );
        }

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
        const { rows: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id },
            "id,name"
        );
        if (cityCount.length === 0) {
            throw new AppError(`City does not exist`, 400);
        }
        const image = req.files ? req.files.image : null;
        if (!image) {
            throw new AppError(`Image is required`, 400);
        }

        // upload city image logic here
        const { objectKey } = await imageUpload(image, `cities/${cityCount[0]?.name}_${Date.now()}.jpg`);
        await database.update(
            tables.CITIES_TABLE,
            { image: objectKey },
            { id }
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
        const { rows: cityCount } = await database.get(
            tables.CITIES_TABLE,
            { id },
            "id, image"
        );
        if (cityCount.length === 0) {
            throw new AppError(`City does not exist`, 400);
        }

        // delete city image logic here

        console.log(cityCount);
        cityCount[0]?.image && await imageDeleteAsync.deleteImage(cityCount[0]?.image);
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

const getCityAdmins = async function (pageNo, pageSize, cityId, searchQuery) {
    const params = [cityId];
    const countParams = [cityId];
    const query = `
    SELECT 
        u.id,
            u.firstName,
            u.username,
            u.email,
            u.phoneNumber
        FROM ${tables.CITY_USER_ROLES_TABLE} cur
        JOIN ${tables.USER_TABLE} u ON u.id = cur.userId
        WHERE cur.cityId = ?
        AND cur.isAdmin = 1
        ${searchQuery.length > 0 ? "AND (u.firstName LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phoneNumber LIKE ?)" : ''}
        LIMIT ?, ?`;

    const countQuery = `SELECT 
        COUNT(*) as total
        FROM ${tables.CITY_USER_ROLES_TABLE} cur
        JOIN ${tables.USER_TABLE} u ON u.id = cur.userId
        WHERE cur.cityId = ?
        AND cur.isAdmin = 1
        ${searchQuery.length > 0 ? "AND (u.firstName LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phoneNumber LIKE ?)" : ''}
        `;

    if (searchQuery.length > 0) {
        params.push(...[`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]);
        countParams.push(...[`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]);
    }

    const limit = (pageNo - 1) * pageSize;
    const offset = pageSize;
    params.push(...[limit, offset]);

    const result = await database.callQuery(query, params);
    const countResult = await database.callQuery(countQuery, countParams);

    return {
        data: result.rows,
        count: countResult.rows[0].total
    };
}

module.exports = router;
