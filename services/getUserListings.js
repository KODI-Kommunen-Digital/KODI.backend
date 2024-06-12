const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

async function getUserListings(req, userId){
    if(!userId){
        userId = req.params.id;
    }
    const pageNo = Number(req.query.pageNo) || 1;
    const pageSize = Number(req.query.pageSize) || 9;

    const filters = {};

    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        throw new AppError(`Invalid UserId ${userId}`, 400);
    }
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        throw new AppError(`Please enter a positive integer for pageNo`, 400);
    }
    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        throw new AppError( `Please enter a positive integer less than or equal to 20 for pageSize`, 400 );
    }

    if (req.query.statusId) {
        const statusId = req.query.statusId;
        // check status id is valid or not before passing it into the query
        if (isNaN(Number(statusId)) || Number(statusId) <= 0) {
            throw new AppError(`Invalid status ${statusId}`, 400);
        }

        try {
            const response = await database.get(
                tables.STATUS_TABLE,
                { id: req.query.statusId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
                throw new AppError( `Invalid Status '${req.query.statusId}' given`, 400 );
            }
        } catch (err) {
            throw new AppError(err);
        }
        filters.statusId = req.query.statusId;
    }

    if (req.query.categoryId) {

        const categoryId = req.query.categoryId;
        // check category id is valid or not before passing it into the query
        if (isNaN(Number(categoryId)) || Number(categoryId) <= 0) {
            throw new AppError(`Invalid category ${categoryId}`, 400);    
        }

        try {
            const response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: categoryId },
                null
            );
            const data = response.rows;
            if (data && data.length === 0) {
                throw new AppError( `Invalid Category '${categoryId}' given`, 400 );
            } else {
                if (req.query.subcategoryId) {

                    const subcategoryId = req.query.subcategoryId;
                    // check subcategory id is valid or not before passing it into the query
                    if (isNaN(Number(subcategoryId)) || Number(subcategoryId) <= 0) {
                        throw new AppError(`Invalid subcategory ${subcategoryId}`, 400);
                    }

                    try {
                        const response = await database.get(
                            tables.SUBCATEGORIES_TABLE,
                            {
                                categoryId,
                                id: subcategoryId,
                            }
                        );
                        const data = response.rows;
                        if (data && data.length === 0) {
                            throw new AppError( `Invalid subCategory '${subcategoryId}' given`, 400 );
                        }
                    } catch (err) {
                        throw new AppError(err);
                    }
                    filters.subcategoryId = subcategoryId;
                }
            }
        } catch (err) {
            throw new AppError(err);
        }
        filters.categoryId = categoryId;
    }

    try {
        const response = await database.callQuery(
            "SELECT cityId, userId, cityUserId, inCityServer FROM cities c INNER JOIN user_cityuser_mapping m ON c.id = m.cityId WHERE userId = ?;",
            [userId]
        );
        const cityMappings = response.rows;
        const individualQueries = [];
        const queryParams = [];
    
        for (const cityMapping of cityMappings) {
            // if the city database is present in the city's server, then we create a federated table in the format
            // heidi_city_{id}_listings and heidi_city_{id}_users in the core databse which points to the listings and users table respectively
            const listingImageTableName = `heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."}listing_images LI_${cityMapping.cityId}`;
            const cityListAlias = `L_${cityMapping.cityId}`;
            let query = `SELECT  
            sub.logo,
            sub.logoCount,
            ${cityListAlias}.*, ${cityMapping.cityId} as cityId,
            otherLogos FROM heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."}listings ${cityListAlias}
            LEFT JOIN (
                SELECT 
                    listingId,
                    MAX(CASE WHEN imageOrder = 1 THEN logo ELSE NULL END) as logo,
                    COUNT(*) as logoCount
                FROM ${listingImageTableName}
                GROUP BY listingId
            ) sub ON ${cityListAlias}.id = sub.listingId
            LEFT JOIN (
                SELECT
                    listingId,
                    JSON_ARRAYAGG(JSON_OBJECT('logo', logo, 'imageOrder', imageOrder,'id',id,'listingId', listingId )) as otherLogos
                FROM ${listingImageTableName}
                GROUP BY listingId
            ) other ON ${cityListAlias}.id = other.listingId
            WHERE ${cityListAlias}.userId = ?`;
            queryParams.push(cityMapping.cityUserId);
    
            // Handle filters with dynamic parameterization
            if (filters.categoryId || filters.statusId) {
                if (filters.categoryId) {
                    query += ` AND ${cityListAlias}.categoryId = ?`;
                    queryParams.push(filters.categoryId);
                }
                if (filters.subcategoryId) {
                    query += ` AND ${cityListAlias}.subcategoryId = ?`;
                    queryParams.push(filters.subcategoryId);
                }
                if (filters.statusId) {
                    query += ` AND ${cityListAlias}.statusId = ?`;
                    queryParams.push(filters.statusId);
                }
            }
            individualQueries.push(query);
        }
    
        if (individualQueries.length > 0) {
            const unionQuery = individualQueries.join(" UNION ALL ");
            const paginationQuery = `SELECT * FROM (${unionQuery}) a ORDER BY createdAt DESC LIMIT ?, ?;`;
            queryParams.push((pageNo - 1) * pageSize, pageSize);
    
            const response = await database.callQuery(paginationQuery, queryParams);
            return response.rows;
        }
        return false;
    } catch (err) {
        throw new AppError(err);
    }
}

module.exports = { getUserListings }