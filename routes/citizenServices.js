const express = require('express');
const router = express.Router();
const database = require('../services/database');
const tables = require('../constants/tableNames');
const AppError = require("../utils/appError");

router.get('/', async function(req, res, next) {
    const cityId = req.cityId;
    database.get(tables.CITIZEN_SERVICES_TABLE).then((response) => {
        let data = response.rows;
        res.status(200).json({
            status: "success",
            data: data,
        });
    }).catch((err) => {
        return next(new AppError(err));
    });

});


module.exports = router;