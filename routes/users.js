const express = require('express');
const router = express.Router();
const database = require('../services/database');
const { USER_TABLE } = require('../constants/tableNames');
const AppError = require("../utils/appError");

router.get('/:id', async function(req, res, next) {
    const id = req.params.id;

    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    database.get(USER_TABLE, {id}).then((response) => {
        let data = response.rows;
        if (!data || data.length == 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }
        res.status(200).json({
            status: "success",
            length: data?.length,
            data: data[0],
        });
    }).catch((err) => {
        return next(new AppError(err));
    });
});



module.exports = router;