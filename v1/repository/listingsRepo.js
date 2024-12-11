const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class ListingsRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_TABLE);
    }

    getUserListingsFromDatabase = async function (
        userId,
        filters,
        cityMappings,
        pageNo,
        pageSize,
    ) {
        const individualQueries = [];
        for (const cityMapping of cityMappings) {
            // let query = `SELECT *, ${cityMapping.cityId} as cityId
            // FROM heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."}listings
            // WHERE userId = ${cityMapping.cityUserId}`;
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
            WHERE ${cityListAlias}.userId = ${cityMapping.cityUserId}`;

            if (filters.categoryId || filters.statusId) {
                if (filters.categoryId) {
                    query += ` AND ${cityListAlias}.categoryId = ${filters.categoryId}`;
                }
                if (filters.subCategoryId) {
                    query += ` AND ${cityListAlias}.subCategoryId = ${filters.subCategoryId}`;
                }
                if (filters.statusId) {
                    query += ` AND ${cityListAlias}.statusId = ${filters.statusId}`;
                }
            }
            individualQueries.push(query);
        }
        if (individualQueries && individualQueries.length > 0) {
            const query = `select * from (
                ${individualQueries.join(" union all ")}
            ) a order by createdAt desc LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};`;
            const response = await database.callQuery(query);
            if (!response || !response.rows) {
                return [];
            }
            return response.rows;
        }
        return [];
    };

    getCityListingsWithFiltersAndPagination = async ({
        filters,
        pageNo,
        pageSize,
        cities,
        sortByStartDate,
    }) => {
        const individualQueries = cities.map((city) => {
            const cityId = city.id;
            return `
            SELECT L.*, 
            IFNULL(sub.logo, '') as logo,
            IFNULL(sub.logoCount, 0) as logoCount,
            U.username, U.firstname, U.lastname, U.image, U.id as coreUserId, ${cityId} as cityId 
            FROM heidi_city_${cityId}${city.inCityServer ? "_" : "."}listings L 
            LEFT JOIN (
                SELECT listingId, MIN(logo) as logo, COUNT(listingId) as logoCount
                FROM heidi_city_${cityId}.listing_images
                GROUP BY listingId
            ) sub ON L.id = sub.listingId
            INNER JOIN user_cityuser_mapping UM 
            ON UM.cityUserId = L.userId AND UM.cityId = ${cityId}
            INNER JOIN users U 
            ON U.id = UM.userId
            ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
            GROUP BY L.id, sub.logo, sub.logoCount, U.username, U.firstname, U.lastname, U.image
            `;
        });

        const query = `
            SELECT * FROM (
                ${individualQueries.join(" UNION ALL ")}
            ) a ORDER BY ${sortByStartDate ? "startDate, createdAt" : "createdAt DESC"}
            LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};
        `;

        const response = await database.callQuery(query);
        return response.rows;
    };

    searchListingsWithFilters = async ({
        filters,
        cities,
        searchQuery,
        pageNo,
        pageSize,
        sortByStartDate,
        statusId,
    }) => {
        const individualQueries = cities.map((city) => {
            let cityQueryParams = [`%${searchQuery}%`, `%${searchQuery}%`];
            let query = `
                SELECT L.*, 
                    IFNULL(sub.logo, '') as logo,
                    IFNULL(sub.logoCount, 0) as logoCount,
                    ${city.id} as cityId 
                FROM heidi_city_${city.id}${city.inCityServer ? "_" : "."}listings L
                LEFT JOIN (
                    SELECT 
                        listingId,
                        MIN(logo) as logo,
                        COUNT(listingId) as logoCount
                    FROM heidi_city_${city.id}.listing_images
                    GROUP BY listingId
                ) sub ON L.id = sub.listingId
                WHERE (L.title LIKE ? OR L.description LIKE ?)
            `;

            if (filters.length > 0) {
                query += ` AND ${filters.join(" AND ")}`;
                cityQueryParams = cityQueryParams.concat([statusId]);
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

        const orderByClause = sortByStartDate
            ? "ORDER BY startDate, createdAt"
            : "ORDER BY createdAt DESC";
        const combinedQuery = `
            SELECT * FROM (${combinedQueryParts.join(" UNION ALL ")}) AS combined 
            ${orderByClause} 
            LIMIT ?, ?
        `;

        const response = await database.callQuery(combinedQuery, combinedParams);
        return response.rows;
    };

    retrieveCityListingsWithFilters = async (cityMappings, filters, pageNo, pageSize) => {
        const individualQueries = [];
        const queryParams = [];
    
        for (const cityMapping of cityMappings) {
            // if the city database is present in the city's server, then we create a federated table in the format
            // heidi_city_{id}_listings and heidi_city_{id}_users in the core databse which points to the listings and users table respectively
            const dbPrefix = cityMapping.inCityServer ? "_" : ".";
            const listingsTable = `heidi_city_${cityMapping.cityId}${dbPrefix}listings`;
            const listingImageTable = `heidi_city_${cityMapping.cityId}${dbPrefix}listing_images`;
            const cityListAlias = `L_${cityMapping.cityId}`;
    
            let query = `
                SELECT  
                    ${cityListAlias}.id,
                    ${cityListAlias}.description,
                    sub.logo,
                    sub.logoCount,
                    sub.otherLogos,
                    ${cityMapping.cityId} as cityId,
                    ${cityListAlias}.createdAt
                FROM ${listingsTable} ${cityListAlias}
                LEFT JOIN (
                    SELECT 
                        listingId,
                        MAX(CASE WHEN imageOrder = 1 THEN logo ELSE NULL END) as logo,
                        COUNT(*) as logoCount,
                        JSON_ARRAYAGG(JSON_OBJECT('logo', logo, 'imageOrder', imageOrder, 'id', id, 'listingId', listingId)) as otherLogos
                    FROM ${listingImageTable}
                    GROUP BY listingId
                ) sub ON ${cityListAlias}.id = sub.listingId
                WHERE ${cityListAlias}.userId = ?`;
            queryParams.push(cityMapping.cityUserId); // Add userId to query parameters
    
            // Append filters
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
    
            individualQueries.push(query);
        }
    
        // Combine queries with UNION ALL and apply pagination
        if (individualQueries.length > 0) {
            const unionQuery = individualQueries.join(" UNION ALL ");
            const paginationQuery = `SELECT * FROM (${unionQuery}) a ORDER BY createdAt DESC LIMIT ?, ?;`;
            queryParams.push((pageNo - 1) * pageSize, pageSize);
    
            try {
                console.log(paginationQuery, queryParams)
                const response = await database.callQuery(paginationQuery, queryParams);
                return response.rows;
            } catch (error) {
                throw new Error('Error retrieving city listings');
            }
        }
        return [];
    }
    
}

module.exports = new ListingsRepo();
