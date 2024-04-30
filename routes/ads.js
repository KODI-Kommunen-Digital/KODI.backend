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
                return next(new AppError("Invalid CityID given"));
            }
        } else {
            return next(new AppError("CityID is not given"));
        }
        let listing

        if (req.query.listingId) {
            if(Number(req.query.listingId)) {
                const response = await database.get(tables.LISTINGS_TABLE, {
                    id: req.query.listingId,
                }, null, req.query.cityId);
                if (response.rows && response.rows.length === 0) {
                    return next(new AppError(`Invalid Listing '${req.query.listingId}' given`, 400));
                }
                listing = response.rows[0];
                if((listing.categoryId !== 1 && listing.categoryId !== 3) || listing.description.length < 650 || listing.createdAt < (currentDate - (12 * 60 * 60 * 1000)) ) {
                    return res.status(200).json({
                        status: "success",
                    });
                }

            } else {
                return next(new AppError("Invalid CityID given"));
            }
        } else {
            return next(new AppError("ListingId is not given"));
        }

        if(listing) {
            const query = `SELECT id, createdAt FROM listings WHERE createdAt > ? AND length(description) > 650 ORDER BY createdAt`
            const response = await database.callQuery(query, [getDateInFormate(new Date(currentDate - (12 * 60 * 60 * 1000)))], Number(filter.cityId))
            const data = response.rows
            if(data[0].id !== Number(req.query.listingId)) {
                return res.status(200).json({
                    status: "success",
                });
            }
        }
        let data
        
        if(filter.cityId && Number(filter.cityId) && !isNaN(Number(filter.cityId))){
            const query = `SELECT id, cityId, image, link, createdAt, lastShown FROM ${tables.ADVERTISEMENTS} WHERE (cityId IS NULL OR cityId = ?) AND enabled = True`
            const response = await database.callQuery(query, [Number(filter.cityId)])
            data = response.rows
        } else {
            const query = `SELECT id, cityId, image, link, createdAt, lastShown FROM ${tables.ADVERTISEMENTS} WHERE cityId IS NULL AND enabled = True`
            const response = await database.callQuery(query)
            data = response.rows
        }

        const dataReturn = data[(Math.floor(Math.random() * data.length))]

        if(dataReturn) {
            // const timeGap = listing.filter((list) => console.log(list.createdAt - dataReturn.lastShown))
            console.log(listing)
            console.log(dataReturn)
        }

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
