const express = require('express');
const router = express.Router();
const connection = require('../services/database');
const AppError = require("../utils/appError");

router.get('/:id', async function(req, res, next) {
    const id = req.params.id;

    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    let query = `SELECT * FROM users where id = ?`;
    connection.query(query, [id], (err, data, fields) => {
        if (err) {
            return next(new AppError(err));
        }
        if (!data || data.length == 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }
        res.status(200).json({
            status: "success",
            length: data?.length,
            data: data[0],
        });
    });
});



module.exports = router;