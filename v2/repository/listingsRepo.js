const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class ListingsRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_TABLE);
    }

    retrieveListings = async ({
        filters = [],
        cities = [],
        pageNo = 1,
        pageSize = 10,
        searchQuery = null,
        sortByStartDate = false
    }) => {
        const queryParams = [];

        let query = `
            SELECT  
                L.id,
                L.title,
                L.description,
                L.createdAt,
                L.userId,
                C.cityId,
                C.cityCount,
                C.allCities,
                sub.logo,
                sub.logoCount,
                sub.otherLogos
            FROM listings L
            INNER JOIN (
                SELECT 
                    listingId,
                    MIN(cityId) as cityId,
                    COUNT(*) as cityCount,
                    JSON_ARRAYAGG(cityId) as allCities
                FROM city_listing_mappings
                ${cities.length > 0 ? " WHERE cityId IN (?)" : ""}
                GROUP BY listingId
            ) C ON L.id = C.listingId
            LEFT JOIN (
                SELECT
                    listingId,
                    MIN(CASE WHEN imageOrder = 1 THEN logo ELSE NULL END) as logo,
                    COUNT(*) as logoCount,
                    JSON_ARRAYAGG(JSON_OBJECT('logo', logo, 'imageOrder', imageOrder, 'id', id, 'listingId', listingId)) as otherLogos
                FROM listing_images
                GROUP BY listingId
            ) sub ON L.id = sub.listingId
            WHERE 1=1
        `;

        if (cities.length > 0) {
            queryParams.push(cities);
        }

        if (searchQuery) {
            query += ` AND (L.title LIKE ? OR L.description LIKE ?)`;
            queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        filters.forEach(filter => {
            if (filter.value !== undefined) {
                query += ` AND L.${filter.key} = ?`;
                queryParams.push(filter.value);
            }
        });

        const orderByClause = sortByStartDate ? " ORDER BY L.startDate, L.createdAt DESC" : " ORDER BY L.createdAt DESC";
        const paginationQuery = `${query} ${orderByClause} LIMIT ?, ?`;
        queryParams.push((pageNo - 1) * pageSize, pageSize);

        try {
            const response = await database.callQuery(paginationQuery, queryParams);
            return response.rows;
        } catch (error) {
            throw new Error('Error retrieving listings');
        }
    }
}

module.exports = new ListingsRepo();
