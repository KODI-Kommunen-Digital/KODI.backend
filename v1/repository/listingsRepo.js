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
}

module.exports = new ListingsRepo();
