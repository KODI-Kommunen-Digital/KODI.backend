const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate");


router.get("/", async function (req, res, next) {
    try {
        const currentDate = new Date();
        
        const filter = {};
        let city
        if (req.query.cityId) {
            if(Number(req.query.cityId)) {
                const response = await database.get(tables.CITIES_TABLE, {
                    id: req.query.cityId,
                });
                if (response.rows && response.rows.length === 0) {
                    return next(new AppError(`Invalid City '${req.query.cityId}' given`, 400));
                }
                city = response.rows[0];
                filter.cityId = city.id;
            } else {
                return next(new AppError("Invalid CityID given", 400));
            }
        } else {
            return next(new AppError("CityID is not given", 400));
        }
        
        const queryLisitngs = `SELECT id, createdAt FROM listings WHERE createdAt > ? AND length(description) > 450 AND categoryId IN (1,3) AND showExternal = false ORDER BY createdAt LIMIT 1`
        const responseListings = await database.callQuery(queryLisitngs, [getDateInFormate(new Date(currentDate - (12 * 60 * 60 * 1000)))], Number(filter.cityId))
        const dataListings = responseListings.rows
        if(!dataListings || dataListings.length <= 0 || dataListings[0].id !== Number(req.query.listingId)) {
            return res.status(200).json({
                status: "success",
            });
        }
        
        
        const query = `SELECT id, cityId, image, link, createdAt FROM ${tables.ADVERTISEMENTS} WHERE (cityId IS NULL OR cityId = ?) AND enabled = True`
        const response = await database.callQuery(query, [Number(filter.cityId)])
        const data = response.rows

        const dataReturn = data[(Math.floor(Math.random() * data.length))]

        if(dataReturn) {
            await database.update(tables.ADVERTISEMENTS, { lastShown: currentDate}, { id: dataReturn.id })
        }
        res.status(200).json({
            status: "success",
            data: dataReturn,
        });
    } catch(error) {
        return next(new AppError(error));
    }
});

module.exports = router;
