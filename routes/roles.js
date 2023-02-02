const express = require('express');
const router = express.Router();
const database = require('../services/database');
const tables = require('../constants/tableNames');

router.get('/', async function(req, res, next) {
    database.get(tables.ROLES_TABLE).then((response) => {
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