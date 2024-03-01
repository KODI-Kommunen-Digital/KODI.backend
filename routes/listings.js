const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");

router.get("/", async function (req, res, next) {
    const params = req.query;
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;
    const filters = [];
    let sortByStartDate = false;
    let cities = [];

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
        filters.push(`L.statusId = ${params.statusId} `);
    }

    if (params.categoryId) {
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
                if (params.subcategoryId) {
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
                    filters.push(`L.subcategoryId = ${params.subcategoryId} `);
                }
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.push(`L.categoryId = ${params.categoryId} `);
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

    if (params.showExternalListings !== 'true') {
        filters.push(`L.sourceId = 1 `);
    }

    try {
        const individualQueries = [];
        for (const city of cities) {
            // if the city database is present in the city's server, then we create a federated table in the format
            // heidi_city_{id}_listings and heidi_city_{id}_users in the core databse which points to the listings and users table respectively
            let query = `SELECT L.*, 
            IFNULL(sub.logo, '') as logo,
            IFNULL(sub.logoCount, 0) as logoCount,
            U.username, U.firstname, U.lastname, U.image, U.id as coreUserId, ${city.id} as cityId 
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
			inner join
            user_cityuser_mapping UM on UM.cityUserId = L.userId AND UM.cityId = ${city.id}
			inner join users U on U.id = UM.userId `;
            if (filters && filters.length > 0) {
                query += "WHERE "
                query += filters.join("AND ");
                query += `GROUP BY L.id,sub.logo, sub.logoCount, U.username, U.firstname, U.lastname, U.image`;
            }
            individualQueries.push(query);
        }

        const query = `select * from (
                ${individualQueries.join(" union all ")}
            ) a order by ${sortByStartDate ?  "startDate, createdAt" : "createdAt desc"} LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};`;
        const response = await database.callQuery(query); 
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
    const filters = {};
    let cityId;
    const searchQuery = params.searchQuery;
    let allListings = [];
    if (params.cityId) {
        cityId = params.cityId;
        if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            return next(new AppError(`Invalid City '${cityId}' given`, 404));
        } else {
            try {
                const response = await database.get(tables.CITIES_TABLE, {
                    id: cityId,
                });
                if (response.rows && response.rows.length === 0) {
                    return next(new AppError(`Invalid City '${cityId}' given`, 404));
                }
            } catch (err) {
                return next(new AppError(err));
            }
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
        filters.statusId = params.statusId;
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
        filters.categoryId = params.categoryId;
    }
    let callQuery = `SELECT listings.*, 
                GROUP_CONCAT(listing_images.logo ORDER BY listing_images.imageOrder) AS images
                FROM listings 
                LEFT JOIN listing_images ON listings.id = listing_images.listingId
                WHERE (listings.title LIKE ? OR listings.description LIKE ?)`;
    if (Object.keys(filters).length > 0) {
        for (const key in filters) {
            callQuery += ` AND listings.${key} = ${filters[key]}`
        }
    }
    callQuery += ` GROUP BY listings.id;`;
    if (!cityId) {
        let cityNumber;
        try {
            const response = await database.get(tables.CITIES_TABLE);
            cityNumber = response.rows.length;
            for (let cityID = 1; cityID <= cityNumber; cityID++) {
                const resp = await database.callQuery(callQuery, [`%${searchQuery}%`, `%${searchQuery}%`], cityID)
                const rows = resp.rows;
                const results = rows.map(row => {
                    return {
                        ...row,
                        images: row.images ? row.images.split(',') : []
                    };
                });
                allListings = allListings.concat(results);
            }
        } catch (err) {
            return next(new AppError(err));
        }
    } else {
        try {
            const resp = await database.callQuery(callQuery, [`%${searchQuery}%`, `%${searchQuery}%`], cityId);
            const rows = resp.rows;
            const results = rows.map(row => {
                return {
                    ...row,
                    images: row.images ? row.images.split(',') : []
                };
            });
            allListings = allListings.concat(results);
        } catch (error) {
            return next(new AppError(error));
        }
    }
    res.status(200).json({
        status: "success",
        data: allListings,
    });
});

module.exports = router;