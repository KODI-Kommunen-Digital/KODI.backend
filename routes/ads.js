const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/", async function (req, res, next) {
    try {
        const filter = {};
        if (req.query.cityId) {
            if(Number(req.query.cityId)) {
                filter.cityId = req.query.cityId;
            } else {
                return next(new AppError("Invalid CityID given"));
            }
        }
        let data
        
        if(filter.cityId && Number(filter.cityId) && !isNaN(Number(filter.cityId))){
            const query = `SELECT id, cityId, image, link, createdAt FROM ${tables.ADVERTISEMENTS} WHERE (cityId IS NULL OR cityId = ?) AND enabled = True`
            const response = await database.callQuery(query, [Number(filter.cityId)])
            data = response.rows
        } else {
            const query = `SELECT id, cityId, image, link, createdAt FROM ${tables.ADVERTISEMENTS} WHERE cityId IS NULL AND enabled = True`
            const response = await database.callQuery(query)
            data = response.rows
        }
        const dataReturn = data[(Math.floor(Math.random() * data.length))]
        res.status(200).json({
            status: "success",
            data: dataReturn,
        });
    } catch(error) {
        return next(new AppError(error));
    }
});

module.exports = router;
