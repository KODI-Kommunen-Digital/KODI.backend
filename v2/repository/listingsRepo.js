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
        let words = [];
        if (searchQuery) {
            // normalize input (you can also replace hyphens with spaces optionally)
            words = searchQuery.trim().split(/[\s\-]+/).filter(Boolean);
        }
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
                ${searchQuery ? `,
                    (CASE 
                        WHEN ${words.map(() => `(L.title LIKE ?)`).join(' AND ')} THEN 1
                        WHEN ${words.map(() => `(L.description LIKE ?)`).join(' AND ')} THEN 2
                        ELSE 3
                    END) AS searchRank
                    ` : ''}
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
                ${cities.length > 0 ? ` WHERE cityId IN (${cities.map(() => '?').join(',')})` : ""}
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
        // For searchRank
        if (searchQuery) {
            // searchRank title AND description word match
            words.forEach(word => queryParams.push(`%${word}%`)); // title
            words.forEach(word => queryParams.push(`%${word}%`)); // description
        }

        // For cityId IN clause in the subquery
        if (cities.length > 0) {
            // The subquery expects one parameter per city, so spread them
            queryParams.push(...cities);
        }
        // WHERE clause
        if (searchQuery) {
            query += ` AND (${words.map(() => `L.title LIKE ?`).join(' AND ')} OR ${words.map(() => `L.description LIKE ?`).join(' AND ')})`;
            words.forEach(word => queryParams.push(`%${word}%`)); // title WHERE
            words.forEach(word => queryParams.push(`%${word}%`)); // description WHERE
        }

        // Date range overlap logic:
        // A listing is "active" in the window [startAfterDate, endBeforeDate] if:
        // (L.startDate <= endBeforeDate) AND (L.endDate >= startAfterDate)
        // If only one bound is provided, adjust accordingly.
        if (startAfterDate && endBeforeDate) {
            query += ` AND (DATE(L.startDate) <= ? AND DATE(L.endDate) >= ?)`;
            queryParams.push(endBeforeDate, startAfterDate);
        } else if (startAfterDate) {
            query += ` AND (DATE(L.endDate) >= ?)`;
            queryParams.push(startAfterDate);
        } else if (endBeforeDate) {
            query += ` AND (DATE(L.startDate) <= ?)`;
            queryParams.push(endBeforeDate);
        }

        filters.forEach((filter) => {
            if (filter.value !== undefined) {
                if (filter.sign.toUpperCase() === "IN" && Array.isArray(filter.value) && filter.value.length > 0) {
                    // Expand the IN clause to the correct number of placeholders
                    query += ` AND L.${filter.key} IN (${filter.value.map(() => '?').join(',')})`;
                    queryParams.push(...filter.value);
                } else {
                    query += ` AND L.${filter.key} = ?`;
                    queryParams.push(filter.value);
                }
            }
        });

        let orderByClause;
        if (searchQuery) {
            // Prioritize title matches, then description matches, then normal order
            orderByClause = sortByStartDate
                ? " ORDER BY searchRank, L.startDate, L.createdAt DESC"
                : " ORDER BY searchRank, L.createdAt DESC";
        } else {
            orderByClause = sortByStartDate
                ? " ORDER BY L.startDate, L.createdAt DESC"
                : " ORDER BY L.createdAt DESC";
        }

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
