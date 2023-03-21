const express = require('express');
const router = express.Router();
const database = require('../services/database');
const tables = require('../constants/tableNames');
const supportedLanguages = require('../constants/supportedLanguages');
const AppError = require("../utils/appError");
const deepl = require('deepl-node');

router.get('/', async function(req, res, next) {
    const params = req.query;
    var pageNo = params.pageNo || 1;
    var pageSize = params.pageSize || 10;
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(new AppError(`Please enter a positive integer for pageNo`, 400));
    }
    if (isNaN(Number(pageSize)) || Number(pageSize) <= 0 || Number(pageSize) > 20) {
        return next(new AppError(`Please enter a positive integer less than or equal to 20 for pageSize`, 400));
    }

    try
    {
        var response = await database.get(tables.CITIES_TABLE, null, null, null, pageNo, pageSize);
        let cities = response.rows;
        var individualQueries = []
        for (var city of cities) {
            // if the city database is present in the city's server, then we create a federated table in the format 
            // heidi_city_{id}_listings in the core databse which points to the listings table
            individualQueries.push(`SELECT * FROM heidi_city_${city.id}${city.inCityServer ? '_' : '.' }listings`)
        }

        var query = `select * from (
                ${individualQueries.join(" union all ")}
            ) a order by createdAt desc LIMIT ${pageNo -1}, ${pageSize};`
        response = await database.callQuery(query, null)
        
        listings = response.rows
        var noOfListings = listings.length
        if (noOfListings > 0 && params.translate && supportedLanguages.includes(params.translate)) {
            var textToTranslate = []
            listings.forEach((listing) => {
                textToTranslate.push(listing.title)
                textToTranslate.push(listing.description)
            });
            const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);
            const translations = await translator.translateText(textToTranslate, null, params.translate);
            for (var i = 0; i < noOfListings; i++) {
                if (translations[2*i].detectedSourceLang != params.translate.slice(0, 2)) {
                    listings[i].titleLanguage = translations[2*i].detectedSourceLang
                    listings[i].titleTranslation = translations[2*i].text
                }
                if (translations[2*i+1].detectedSourceLang != params.translate.slice(0, 2)) {
                    listings[i].descriptionLanguage = translations[2*i+1].detectedSourceLang
                    listings[i].descriptionTranslation = translations[2*i+1].text
                }
            }
        }
        res.status(200).json({
            status: "success",
            data: response.rows,
        });
    } catch (err) {
        return next(new AppError(err));
    };

});


module.exports = router;