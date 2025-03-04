const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");
const authentication = require("../middlewares/authentication");
const optionalAuthentication = require("../middlewares/optionalAuthentication");
const { createListing } = require('../services/listingFunctions');
const status = require("../constants/status");
const roles = require("../constants/roles");

router.get("/", optionalAuthentication, async function (req, res, next) {
    const params = req.query;
    const pageNo = Number(params.pageNo) || 1;
    const pageSize = Number(params.pageSize) || 9;
    let sortByStartDate = false;
    let cities = [];
    const queryFilterParams = [];
    let queryFilters = '';

    // Validate pageNo
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(
            new AppError(`Please enter a positive integer for pageNo`, 400)
        );
    }
    // Validate pageSize
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

    // Validate sortByStartDate
    if (params.sortByStartDate) {
        const sortByStartDateString = params.sortByStartDate.toString();
        if (sortByStartDateString !== 'true' && sortByStartDateString !== 'false') {
            return next(
                new AppError(`The parameter sortByCreatedDate can only be a boolean`, 400)
            );
        } else {
            sortByStartDate = sortByStartDateString === 'true';
        }
    }

    // Validate statusId
    if (req.roleId === roles.Admin && params.statusId) {
        if (isNaN(Number(params.statusId)) || Number(params.statusId) <= 0) {
            return next(new AppError(`Invalid status ${params.statusId}`, 400));
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
    } else {
        queryFilters += ` AND L.statusId = ? `;
        queryFilterParams.push(status.Active);
    }

    // Validate categoryId and subcategoryId
    if (params.categoryId) {
        if (isNaN(Number(params.categoryId)) || Number(params.categoryId) <= 0) {
            return next(new AppError(`Invalid category ${params.categoryId}`, 400));
        }

        try {
            let response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: params.categoryId, isEnabled: true }
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
                    if (isNaN(Number(params.subcategoryId)) || Number(params.subcategoryId) <= 0) {
                        return next(
                            new AppError(`Invalid Subcategory '${params.subcategoryId}' given`, 400)
                        );
                    }
                    try {
                        response = await database.get(tables.SUBCATEGORIES_TABLE, {
                            id: params.subcategoryId,  // Corrected the query condition
                            categoryId: params.categoryId
                        });
                        const subcategoryData = response.rows;
                        if (subcategoryData && subcategoryData.length === 0) {
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

    // Validate cityId
    try {
        if (params.cityId) {
            if (isNaN(Number(params.cityId)) || Number(params.cityId) <= 0) {
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

    // Validate showExternalListings
    if (params.showExternalListings !== 'true') {
        queryFilters += ` AND L.sourceId = 1 `;
    }

    // Validate appointmentId
    if (params.appointmentId) {
        if (isNaN(Number(params.appointmentId)) || Number(params.appointmentId) <= 0) {
            return next(new AppError("Invalid AppointmentId"));
        }
        queryFilters += ` AND L.appointmentId = ? `;
        queryFilterParams.push(Number(params.appointmentId));
    }

    // New dateFilter logic
    if (params.dateFilter) {
        const dateFilter = params.dateFilter.toLowerCase();
        const today = new Date();
        let startDateCondition = "";

        switch (dateFilter) {
        case "today":{
            // Start date is today's date
            const todayStr = today.toISOString().split("T")[0]; // Get YYYY-MM-DD format
            startDateCondition = ` AND L.startDate BETWEEN '${todayStr} 00:00:00' AND  '${todayStr} 23:59:00'`;
            break;
        }
        case "week":{
            // Start date is within the current week (Monday to Sunday)
            const currentDay = today.getDay();
            const firstDayOfWeek = new Date(today);
            firstDayOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Set to Monday
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Set to Sunday

            const firstDayStr = firstDayOfWeek.toISOString().split("T")[0];
            const lastDayStr = lastDayOfWeek.toISOString().split("T")[0];

            startDateCondition = ` AND L.startDate BETWEEN '${firstDayStr}' AND '${lastDayStr}' `;
            break;
        }
        case "month":{
            // Start date is within the current month
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const firstMonthStr = firstDayOfMonth.toISOString().split("T")[0];
            const lastMonthStr = lastDayOfMonth.toISOString().split("T")[0];

            startDateCondition = ` AND L.startDate BETWEEN '${firstMonthStr}' AND '${lastMonthStr}' `;
            break;
        }
        default:
            return next(
                new AppError("Invalid dateFilter value. Use 'today', 'week', or 'month'.", 400)
            );
        }

        queryFilters += startDateCondition;
    }

    // Construct and execute the final query
    try {
        const individualQueries = [];
        const queryParams = [];
        for (const city of cities) {
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
            INNER JOIN user_cityuser_mapping UM on UM.cityUserId = L.userId AND UM.cityId = ?
            INNER JOIN users U on U.id = UM.userId
            WHERE 1=1 ${queryFilters}
            GROUP BY L.id, sub.logo, sub.logoCount, U.username, U.firstname, U.lastname, U.image`;
            individualQueries.push(cityQuery);
            queryParams.push(city.id, city.id, ...queryFilterParams);
        }
        const paginationParams = [((pageNo - 1) * pageSize), pageSize];
        const fullQuery = `SELECT DISTINCT U.* FROM (${individualQueries.join(" UNION ALL ")}) AS U 
        ORDER BY ${sortByStartDate ? "startDate, createdAt" : "createdAt DESC"} LIMIT ?, ?;`;
        const finalQueryParams = queryParams.concat(paginationParams);
        const response = await database.callQuery(fullQuery, finalQueryParams);
        const listings = response.rows;
        const noOfListings = listings.length;

        // Handle translations if needed
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

        // Remove viewCount from listings
        listings.forEach(listing => delete listing.viewCount);

        // Send response
        return res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.get("/search", async function (req, res, next) {
    const params = req.query;
    const pageNo = parseInt(params.pageNo) || 1;
    const pageSize = parseInt(params.pageSize) || 9;
    const filters = [];
    let cities = [];
    let sortByStartDate = false;
    const searchQuery = params.searchQuery;

    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(new AppError(`Please enter a positive integer for pageNo`, 400));
    }
    if (isNaN(Number(pageSize)) || Number(pageSize) <= 0 || Number(pageSize) > 20) {
        return next(new AppError(`Please enter a positive integer less than or equal to 20 for pageSize`, 400));
    }

    try {
        if (params.cityId) {
            const response = await database.get(tables.CITIES_TABLE, { id: params.cityId }, null);
            cities = response.rows;
            if (cities && cities.length === 0) {
                return next(new AppError(`Invalid CityId '${params.cityId}' given`, 400));
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

    const queryParams = [];
    params.statusId = params.statusId || 1;
    if (isNaN(Number(params.statusId)) || Number(params.statusId) <= 0) {
        next(new AppError(`Invalid status ${params.statusId}`, 400));
        return;
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
    filters.push(`L.statusId = ?`);
    queryParams.push(params.statusId);

    const individualQueries = cities.map(city => {
        let cityQueryParams = [`%${searchQuery}%`, `%${searchQuery}%`]; 
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
            WHERE (L.title LIKE ? OR L.description LIKE ?)`;

        if (filters.length > 0) {
            query += ` AND ${filters.join(" AND ")}`;
            cityQueryParams = cityQueryParams.concat(queryParams);
        }

        query += ` GROUP BY L.id, sub.logo, sub.logoCount`;
        return { query, params: cityQueryParams };
    });

    const combinedQueryParts = [];
    let combinedParams = [];
    individualQueries.forEach(({ query, params }) => {
        combinedQueryParts.push(`(${query})`);
        combinedParams = combinedParams.concat(params);
    });
    const paginationParams = [(pageNo - 1) * pageSize, pageSize];
    combinedParams = combinedParams.concat(paginationParams);

    const orderByClause = sortByStartDate ? "ORDER BY startDate, createdAt" : "ORDER BY createdAt DESC";
    const combinedQuery = `SELECT * FROM (${combinedQueryParts.join(" UNION ALL ")}) AS combined 
                            ${orderByClause} 
                            LIMIT ?, ?`;

    try {
        const response = await database.callQuery(combinedQuery, combinedParams);
        const listings = response.rows;
        listings.forEach(listing => delete listing.viewCount);

        res.json({
            status: "success",
            data: listings,
        });
    } catch (error) {
        next(new Error(`An error occurred while fetching listings: ${error.message}`));
    }
});

router.post("/", authentication, async function (req, res, next) {
    const payload = req.body;
    const cityIds = payload.cityIds;

    if (!cityIds) {
        return next(new AppError(`CityIds not present`, 400));
    }

    if (!Array.isArray(cityIds)) {
        return next(new AppError(`CityIds should be an array`, 400));
    }

    for (const cityId of cityIds) {
        if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            return next(new AppError(`Invalid City '${cityId}' given`, 400));
        }
    }

    try {
        const response = await createListing(cityIds, payload, req.userId, req.roleId)
        return res.status(200).json({
            status: "success",
            data: response
        });
    } catch (err) {
        if(err instanceof AppError) {
            return next(err);
        }
        return next(new AppError(err));
    }
});

module.exports = router;
