const express = require('express');
const router = express.Router();
const database = require('../services/database');

router.get('/', async function(req, res, next) {
    try {
        const rows = await database.query(
            `SELECT *
            FROM listings`
        );
        return rows;
    } catch (err) {
        console.error(`Error while fetching listings `, err.message);
        next(err);
    }
});

module.exports = router;