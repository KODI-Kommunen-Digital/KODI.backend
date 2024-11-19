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
}

module.exports = new ListingsRepo();
