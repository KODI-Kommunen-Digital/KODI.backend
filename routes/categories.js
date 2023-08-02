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
    const params = req.query;

    if(params.cityId){
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: params.cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(
                    new AppError(`Invalid City '${params.cityId}' given`, 404)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        const query = `SELECT categoryId, COUNT(*) as count FROM heidi_city_${params.cityId}.listings GROUP BY categoryId;`;
        const response = await database.callQuery(query)
        res.status(200).json({
            status:"success",
            data:response.rows
        });
    }else{
        let query = `SELECT categoryId, COUNT(categoryId) AS totalCount FROM  (`;
        let innerQuery = ``;
        try {
            const cityConnection = await database.get(tables.CITIES_TABLE, null, "id");
            for (const data of cityConnection.rows){
                innerQuery += `SELECT categoryId FROM heidi_city_${data.id}.listings UNION ALL `;
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
