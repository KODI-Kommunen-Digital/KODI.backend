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
        sortByStartDate = false,
        startAfterDate = null, // Start date for range
        endBeforeDate = null,   // End date for range
    }) => {
        const queryParams = [];

        let query = `
            SELECT  
                L.id,
                L.title,
                L.description,
                L.createdAt,
                L.userId,
                L.startDate,
                L.endDate,
                L.statusId,
                L.categoryId,
                L.subcategoryId,
                L.showExternal,
                L.appointmentId,
                L.viewCount,
                L.externalId,
                L.expiryDate,
                L.sourceId,
                L.website,
                L.address,
                L.email,
                L.phone,
                L.zipcode,
                L.pdf,
                C.cityId,
                C.cityCount,
                C.allCities,
                sub.logo,
                sub.logoCount,
                sub.otherLogos
            FROM listings L
            INNER JOIN (
                SELECT 
                    clm.listingId,
                    (SELECT cityId FROM city_listing_mappings WHERE listingId = clm.listingId ORDER BY cityOrder ASC LIMIT 1) AS cityId,
                    COUNT(*) AS cityCount,
                    JSON_ARRAYAGG(cityId ORDER BY cityOrder ASC) AS allCities
                FROM city_listing_mappings clm
                ${cities.length > 0 ? " WHERE cityId IN (?)" : ""}
                GROUP BY clm.listingId
            ) C ON L.id = C.listingId
            LEFT JOIN (
                SELECT
                    listingId,
                    MIN(CASE WHEN imageOrder = 1 THEN logo ELSE NULL END) AS logo,
                    COUNT(*) AS logoCount,
                    JSON_ARRAYAGG(JSON_OBJECT('logo', logo, 'imageOrder', imageOrder, 'id', id, 'listingId', listingId)) AS otherLogos
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

        if (startAfterDate) {
            query += ` AND DATE(L.startDate) >= ?`;
            queryParams.push(startAfterDate);
        }

        if (endBeforeDate) {
            query += ` AND DATE(L.startDate) <= ?`;
            queryParams.push(endBeforeDate);
        }

        filters.forEach((filter) => {
            if (filter.value !== undefined) {
                if (filter.sign.toUpperCase() === "IN" && Array.isArray(filter.value) && filter.value.length > 0) {
                    query += ` AND L.${filter.key} IN (?)`;
                    queryParams.push(filter.value);
                } else {
                    query += ` AND L.${filter.key} = ?`;
                    queryParams.push(filter.value);
                }
            }
        });

        const orderByClause = sortByStartDate ? " ORDER BY L.startDate, L.createdAt DESC" : " ORDER BY L.createdAt DESC";
        const paginationQuery = `${query} ${orderByClause} LIMIT ?, ?`;
        const offset = (pageNo - 1) * pageSize;
        queryParams.push(parseInt(offset, 10), parseInt(pageSize, 10));

        try {
            const response = await database.callQuery(paginationQuery, queryParams);
            return response.rows;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Error retrieving listings");
        }
    };
}

module.exports = new ListingsRepo();
