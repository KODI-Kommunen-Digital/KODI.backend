const express = require('express');
const router = express.Router();
const connection = require('../services/database');

router.get('/', async function(req, res, next) {
    let query = "SELECT * FROM users";
    connection.query(query, (err, data, fields) => {
        if (err) {
            console.log("error: ", err);
            next(null, err);
            return;
        }
        res.status(200).json({
            status: "success",
            length: data?.length,
            data: data,
        });
    });
});



module.exports = router;