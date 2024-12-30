const express = require("express");
const router = express.Router();
const database = require("../utils/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/streets", async function (req, res, next) {
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (cityId) {
        try {
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: parseInt(cityId) },
                null,
            );
            if (response.rows.cities && response.rows.cities.length === 0) {
                return next(new AppError(`Invalid CityId '${cityId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(tables.MULLKALENDER_STREETS, { cityId }, "id, name")
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.get("/wasteTypes", async function (req, res, next) {
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (cityId) {
        try {
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: parseInt(cityId) },
                null,
            );
            if (response.rows.cities && response.rows.cities.length === 0) {
                return next(new AppError(`Invalid CityId '${cityId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(tables.MULLKALENDER_WASTE_TYPES, null, "id, name")
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.get("/streets/:streetId/pickupDates", async function (req, res, next) {
    const cityId = req.cityId;
    const streetId = req.params.streetId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (cityId) {
        try {
            let response = await database.get(
                tables.CITIES_TABLE,
                { id: parseInt(cityId) },
                null,
            );
            if (response.rows.cities && response.rows.cities.length === 0) {
                return next(new AppError(`Invalid CityId '${cityId}' given`, 400));
            }

            response = await database.callQuery(
                `with street as (select * from mullkalender_streets 
                    where id = ? and cityId = ?)
                    select md.dateofPickup, mwt.name as wastetypeName, md.dateEpoch, mwt.id as wasteTypeId from street mst
                    inner join mullkalender_street_properties_house msph
                    on msph.streetId = mst.id
                    inner join mullkalender_properties mp
                    on mp.id = msph.propertyId
                    inner join mullkalender_pickup_groups mpg
                    on mpg.pickupGroupId = mp.pickupGroupId
                    inner join mullkalender_dates md
                    on md.dateGroup = mpg.dateGroupId 
                    inner join mullkalender_waste_types mwt
                    on mwt.id = mpg.wasteId order by md.dateofPickup;`,
                [streetId, cityId],
            );

            const groupedDates = {};

            response.rows.forEach((element) => {
                if (!groupedDates[element.dateofPickup.toISOString()]) {
                    groupedDates[element.dateofPickup.toISOString()] = [];
                }
                groupedDates[element.dateofPickup.toISOString()].push(element);
            });

            res.status(200).json({
                status: "success",
                data: groupedDates,
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
});

module.exports = router;
