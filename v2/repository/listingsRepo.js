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
        eventType = null,       // singleDay, multiDay, recurring (for Events category)
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
                    (SELECT CAST(CONCAT('[', GROUP_CONCAT(cityId ORDER BY cityOrder ASC SEPARATOR ','), ']') AS JSON)
                     FROM city_listing_mappings 
                     WHERE listingId = clm.listingId) AS allCities
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
            LEFT JOIN (
                SELECT listingId, COUNT(*) as recurrenceCount
                FROM listings_recurrence_rules
                GROUP BY listingId
            ) RR ON L.id = RR.listingId
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

        if (eventType) {
            if (eventType === 'recurring') {
                // Has recurrence rules
                query += ` AND RR.recurrenceCount > 0`;
            } else if (eventType === 'singleDay') {
                // Same day start/end OR endDate is NULL (single day events) AND no recurrence rules
                query += ` AND (RR.recurrenceCount IS NULL OR RR.recurrenceCount = 0)`;
                query += ` AND (L.endDate IS NULL OR DATE(L.startDate) = DATE(L.endDate))`;
            } else if (eventType === 'multiDay') {
                // Different day start/end AND no recurrence rules (endDate must exist and be different from startDate)
                query += ` AND (RR.recurrenceCount IS NULL OR RR.recurrenceCount = 0)`;
                query += ` AND L.endDate IS NOT NULL AND DATE(L.startDate) != DATE(L.endDate)`;
            }
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

        const orderByClause = sortByStartDate ? " ORDER BY L.startDate ASC, L.createdAt DESC, L.id DESC" : " ORDER BY L.createdAt DESC, L.id DESC";
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

    getPendingListingsCount = async () => {
        const query = `SELECT COUNT(*) as count FROM listings WHERE statusId = 2`;
        const response = await database.callQuery(query);
        return response.rows[0].count;
    };
}

module.exports = new ListingsRepo();
