const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const moreInfoTranslations = require("../constants/moreInfoTranslations");
const AppError = require("../utils/appError");

router.get("/", async function (req, res, next) {
    let language = "de";
    if (req.query.language === "en") {
        language = "en";
    }
    database
        .get(tables.MORE_INFO_TABLE)
        .then((response) => {
            const data = response.rows;
            data.forEach(d => {
                d.title = moreInfoTranslations[language][d.title]
            })
            res.status(200).json({
                status: "success",
                data,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

module.exports = router;
