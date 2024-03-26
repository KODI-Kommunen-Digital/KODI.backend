const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");

router.get("/", async function (req, res, next) {
    const params = req.query;
    const pageNo = Number(params.pageNo) || 1;
    const pageSize = Number(params.pageSize) || 9;
    // const filters = [];
    let sortByStartDate = false;
    let cities = [];
    const queryFilterParams = [];
    let queryFilters = '';

    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(
            new AppError(`Please enter a positive integer for pageNo`, 400)
        );
    }
    if (
        isNaN(Number(pageSize)) ||
    Number(pageSize) <= 0 ||
    Number(pageSize) > 20
    ) {
        return next(
            new AppError(
                `Please enter a positive integer less than or equal to 20 for pageSize`,
                400
            )
        );
    }

    if (params.sortByStartDate) {
        const sortByStartDateString = params.sortByStartDate.toString()
        if (sortByStartDateString !== 'true' && sortByStartDateString !== 'false') {
            return next(
                new AppError(`The parameter sortByCreatedDate can only be a boolean`, 400)
            );
        } else {
            sortByStartDate = sortByStartDateString === 'true';
        }
    }

    if (params.statusId) {
        if (!Number(params.statusId)){
            return next(
                new AppError(`Invalid Status '${params.statusId}' given`, 400)
            );
        }
        try {
            const response = await database.get(
                tables.STATUS_TABLE,
                { id: params.statusId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Status '${params.statusId}' given`, 400)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        queryFilters += ` AND L.statusId = ? `;
        queryFilterParams.push(Number(params.statusId));
    }

    if (params.categoryId) {
        if (!Number(params.categoryId)){
            return next(
                new AppError(`Invalid category '${params.categoryId}' given`, 400)
            );
        }
        try {
            let response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: params.categoryId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Category '${params.categoryId}' given`, 400)
                );
            } else {
                queryFilters += ` AND L.categoryId = ? `;
                queryFilterParams.push(Number(params.categoryId));
                if (params.subcategoryId) {
                    if (!Number(params.subcategoryId)){
                        return next(
                            new AppError(`Invalid Subcategory '${params.subcategoryId}' given`, 400)
                        );
                    }
                    try {
                        response = database.get(tables.SUBCATEGORIES_TABLE, {
                            categoryId: params.categoryId,
                        });
                        const data = response.rows;
                        if (data && data.length === 0) {
                            return next(
                                new AppError(
                                    `Invalid subCategory '${params.subcategoryId}' given`,
                                    400
                                )
                            );
                        }
                    } catch (err) {
                        return next(new AppError(err));
                    }
                    queryFilters += ` AND L.subcategoryId = ? `;
                    queryFilterParams.push(Number(params.subcategoryId));
                }
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        if (params.cityId) {
            if (!Number(params.cityId)){
                return next(
                    new AppError(`Invalid City '${params.cityId}' given`, 400)
                );
            }
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: params.cityId },
                null
            );
            cities = response.rows;
            if (cities && cities.length === 0) {
                return next(
                    new AppError(`Invalid CityId '${params.cityId}' given`, 400)
                );
            }
        } else {
            const response = await database.get(tables.CITIES_TABLE);
            cities = response.rows;
        }
    } catch (err) {
        return next(new AppError(err));
    }

    if (params.showExternalListings !== 'true') {
        queryFilters += ` AND L.sourceId = 1 `;
    }

    if (params.appointmentId && JSON.parse(params.appointmentId) && Array.isArray(JSON.parse(params.appointmentId))) {
        queryFilters += ` AND L.appointmentId IN (?)`;
        queryFilterParams.push(JSON.parse(params.appointmentId).toString())

    }

    try {
        const individualQueries = [];
        const queryParams = [];
        for (const city of cities) {
            // if the city database is present in the city's server, then we create a federated table in the format
            // heidi_city_{id}_listings and heidi_city_{id}_users in the core databse which points to the listings and users table respectively
            const cityQuery = `SELECT L.*, 
            IFNULL(sub.logo, '') as logo,
            IFNULL(sub.logoCount, 0) as logoCount,
            U.username, U.firstname, U.lastname, U.image, U.id as coreUserId, ? as cityId 
            FROM heidi_city_${city.id}${city.inCityServer ? "_" : "."}listings L
            LEFT JOIN 
            (
                SELECT 
                    listingId,
                    MIN(logo) as logo,
                    COUNT(listingId) as logoCount
                FROM heidi_city_${city.id}.listing_images
                GROUP BY listingId
            ) sub ON L.id = sub.listingId 
            inner join user_cityuser_mapping UM on UM.cityUserId = L.userId AND UM.cityId = ?
            inner join users U on U.id = UM.userId
            WHERE 1=1 ${queryFilters}
            GROUP BY L.id, sub.logo, sub.logoCount, U.username, U.firstname, U.lastname, U.image`;
            individualQueries.push(cityQuery);
            queryParams.push(city.id, city.id , ...queryFilterParams);
        }
        const paginationParams = [((pageNo - 1) * pageSize), pageSize];
        const fullQuery = `select * from (${individualQueries.join(" union all ")}) AS combined 
        ORDER BY ${sortByStartDate ? "startDate, createdAt" : "createdAt desc"} LIMIT ?, ?;`;
        const finalQueryParams = queryParams.concat(paginationParams);
        const response = await database.callQuery(fullQuery, finalQueryParams);
        const listings = response.rows;
        const noOfListings = listings.length;

        if (
            noOfListings > 0 &&
      params.translate &&
      supportedLanguages.includes(params.translate)
        ) {
            const textToTranslate = [];
            listings.forEach((listing) => {
                textToTranslate.push(listing.title);
                textToTranslate.push(listing.description);
            });
            const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);
            const translations = await translator.translateText(
                textToTranslate,
                null,
                params.translate
            );
            for (let i = 0; i < noOfListings; i++) {
                if (
                    translations[2 * i].detectedSourceLang !== params.translate.slice(0, 2)
                ) {
                    listings[i].titleLanguage = translations[2 * i].detectedSourceLang;
                    listings[i].titleTranslation = translations[2 * i].text;
                }
                if (
                    translations[2 * i + 1].detectedSourceLang !==
          params.translate.slice(0, 2)
                ) {
                    listings[i].descriptionLanguage =
            translations[2 * i + 1].detectedSourceLang;
                    listings[i].descriptionTranslation = translations[2 * i + 1].text;
                }
            }
        }
        return res.status(200).json({
            status: "success",
            data: response.rows,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.get("/search", async function (req, res, next) {
    const params = req.query;
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;
    const filters = [];
    let cities = [];
    let sortByStartDate = false;
    const searchQuery = params.searchQuery;

    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(
            new AppError(`Please enter a positive integer for pageNo`, 400)
        );
    }
    if (
        isNaN(Number(pageSize)) ||
    Number(pageSize) <= 0 ||
    Number(pageSize) > 20
    ) {
        return next(
            new AppError(
                `Please enter a positive integer less than or equal to 20 for pageSize`,
                400
            )
        );
    }

    try {
        if (params.cityId) {
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: params.cityId },
                null
            );
            cities = response.rows;
            if (cities && cities.length === 0) {
                return next(
                    new AppError(`Invalid CityId '${params.cityId}' given`, 400)
                );
            }
        } else {
            const response = await database.get(tables.CITIES_TABLE);
            cities = response.rows;
        }
    } catch (err) {
        return next(new AppError(err));
    }
    if (params.sortByStartDate) {
        const sortByStartDateString = params.sortByStartDate.toString()
        if (sortByStartDateString !== 'true' && sortByStartDateString !== 'false') {
            return next(
                new AppError(`The parameter sortByCreatedDate can only be a boolean`, 400)
            );
        } else {
            sortByStartDate = sortByStartDateString === 'true';
        }
    }
    if (params.statusId) {
        try {
            const response = await database.get(
                tables.STATUS_TABLE,
                { id: params.statusId }
            );

            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Status '${params.statusId}' given`, 400)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.push(`L.statusId = ${params.statusId} `);
    }
    if (params.categoryId) {
        try {
            const response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: params.categoryId }
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Category '${params.categoryId}' given`, 400)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.push(`L.categoryId = ${params.categoryId} `);
    }

    const individualQueries = cities.map(city => {
        let query = `SELECT L.*, 
        IFNULL(sub.logo, '') as logo,
        IFNULL(sub.logoCount, 0) as logoCount,
        ${city.id} as cityId 
        FROM heidi_city_${city.id}${city.inCityServer ? "_" : "."}listings L
        LEFT JOIN 
        (
            SELECT 
                listingId,
                MIN(logo) as logo,
                COUNT(listingId) as logoCount
            FROM heidi_city_${city.id}.listing_images
            GROUP BY listingId
        ) sub ON L.id = sub.listingId
        WHERE (L.title LIKE '%${searchQuery}%' OR L.description LIKE '%${searchQuery}%')`;

        // Add filters to the query
        if (filters.length > 0) {
            query += ` AND ${filters.join(" AND ")}`;
        }
        query += ` GROUP BY L.id, sub.logo, sub.logoCount`;
        return query;
    });

    const combinedQuery = `SELECT * FROM (${individualQueries.join(" UNION ALL ")}) AS combined 
                            ORDER BY ${sortByStartDate ? "startDate, createdAt" : "createdAt DESC"} 
                            LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`;

    try {
        const response = await database.callQuery(combinedQuery);
        const listings = response.rows;

        res.json({
            status: "success",
            data: listings,
        });
    } catch (error) {
        next(new Error(`An error occurred while fetching listings: ${error.message}`));
    }
});

module.exports = router;