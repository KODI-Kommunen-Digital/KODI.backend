const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/", async function (req, res, next) {
    const id = req.query.id;
    database.get(tables.CITIZEN_SERVICES_TABLE, id?{ id }:null)
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

router.get("/citizenServiceData", async function (req, res, next) {
    const cityId = req.query.cityId || null;
    let citizenServiceId;
    if(req.query.citizenServiceId)
        citizenServiceId = req.query.citizenServiceId;
    let promise = null;
    if (cityId) {
        if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            return next(new AppError(`City is not present`, 404));
        } else {
            try {
                const response = await database.get(tables.CITIES_TABLE, { id: cityId });
                if (response.rows && response.rows.length === 0) {
                    return next(new AppError(`Invalid City '${cityId}' given`, 400));
                }
            } catch (err) {
                return next(new AppError(err));
            }
        }
        promise = database.get(tables.CITIZEN_SERVICES_DATA_TABLE, { cityId, citizenServiceId });
    } else {
        promise = database.get(tables.CITIZEN_SERVICES_DATA_TABLE, {citizenServiceId} );
    }

    promise
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

module.exports = router;
