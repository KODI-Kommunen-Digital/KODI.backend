const database = require("../utils/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

const createListingWithTransaction = async function (payload, transaction) {
    return await database.createWithTransaction(
        tables.LISTINGS_TABLE,
        payload,
        transaction,
    );
};

const createUserListingMappingWithTransaction = async function (
    cityId,
    userId,
    listingId,
    transaction,
) {
    return await database.createWithTransaction(
        tables.USER_LISTING_MAPPING_TABLE,
        {
            cityId,
            userId,
            listingId,
        },
        transaction,
    );
};

const getCityListingWithId = async function (id, cityId) {
    const response = await database.get(
        tables.LISTINGS_TABLE,
        { id },
        null,
        cityId,
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows[0];
};

const getCityListingImage = async function (listingId, cityId) {
    const response = await database.get(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        null,
        cityId,
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows;
};

const setViewCount = async function (listingId, viewCount, cityId) {
    try {
        await database.update(
            tables.LISTINGS_TABLE,
            { viewCount },
            { id: listingId },
            cityId,
        );
    } catch (err) {
        throw new AppError(`Failed to update view count: ${err.message}`, 500);
    }
};

const deleteListingImage = async function (listingId, cityId) {
    return await database.deleteData(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        cityId,
    );
};

const deleteListingImageWithTransaction = async function (
    listingId,
    transaction,
) {
    return await database.deleteDataWithTransaction(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        transaction,
    );
};

const getAllListingsWithFilters = async function (
    filters,
    cityId,
    pageNo,
    pageSize,
) {
    const response = await database.get(
        tables.LISTINGS_TABLE,
        filters,
        null,
        cityId,
        pageNo,
        pageSize,
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows;
};

const getAllListingsWithFiltersQuery = async (filters, cityId) => {
    const query = `SELECT L.*, 
        IFNULL(sub.logo, '') as logo,
        IFNULL(sub.logoCount, 0) as logoCount,
        U.username, U.firstname, U.lastname, U.image, U.id as coreUserId, ${cityId} as cityId 
        FROM heidi_city_${cityId}.listings L
        LEFT JOIN (
            SELECT listingId, MIN(logo) as logo, COUNT(listingId) as logoCount
            FROM heidi_city_${cityId}.listing_images
            GROUP BY listingId
        ) sub ON L.id = sub.listingId
        INNER JOIN user_cityuser_mapping UM ON UM.cityUserId = L.userId AND UM.cityId = ${cityId}
        INNER JOIN users U ON U.id = UM.userId
        WHERE L.id IN (${filters.id.join()})
        ${filters.categoryId ? `AND L.categoryId = ${filters.categoryId}` : ""}
        GROUP BY L.id, sub.logo, sub.logoCount, U.username, U.firstname, U.lastname, U.image`;

    const response = await database.callQuery(query);
    return response.rows;
};

const getCityListingsWithFiltersAndPagination = async ({
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

const searchListingsWithFilters = async ({
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

const deleteListingForUserWithTransaction = async (userId, transaction) => {
    await database.deleteDataWithTransaction(
        tables.LISTINGS_TABLE,
        { userId },
        transaction,
    );
};

const deleteUserListingMappingWithTransaction = async (userId, transaction) => {
    await database.deleteDataWithTransaction(
        tables.USER_LISTING_MAPPING_TABLE,
        {
            userId,
        },
        transaction,
    );
};

module.exports = {
    createListingWithTransaction,
    createUserListingMappingWithTransaction,
    getCityListingWithId,
    getCityListingImage,
    getAllListingsWithFilters,
    getCityListingsWithFiltersAndPagination,
    deleteListingForUserWithTransaction,
    deleteUserListingMappingWithTransaction,
    deleteListingImage,
    getAllListingsWithFiltersQuery,
    deleteListingImageWithTransaction,
    searchListingsWithFilters,
    setViewCount,
};
