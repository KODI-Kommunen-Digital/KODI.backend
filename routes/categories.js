const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/", async function (req, res, next) {
    database
        .get(tables.CATEGORIES_TABLE)
        .then((response) => {
            	const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        }).catch((err) => {
            return next(new AppError(err));
        });
});

router.get("/listingsCount", async function(req, res, next){
    let query = `SELECT categoryId, SUM(count) AS totalCount FROM (`;
    let innerQuery = ``;
    try {
        const cityConnection = await database.get(tables.CITIES_TABLE, null, "id");
        for (const data of cityConnection.rows){
            innerQuery += `SELECT categoryId, COUNT(id) AS count FROM heidi_city_${data.id}.listings GROUP BY categoryId UNION ALL `
        }
        innerQuery = innerQuery.slice(0,-11);
        query += innerQuery + `) AS combinedResults GROUP BY categoryId;`;

        const response = await database.callQuery(query)
        res.status(200).json({
            status:"success",
            data:response.rows
        });
    } catch (err) {
        return next(new AppError(err));
    }   
});

router.get("/:id/subcategories", async function (req, res, next) {
    const categoryId = req.params.id;
    database
        .get(tables.SUBCATEGORIES_TABLE, { categoryId })
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        }).catch((err) => {
            return next(new AppError(err));
        });
});

module.exports = router;
