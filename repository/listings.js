const database = require("../utils/database");
const tables = require("../constants/tableNames");

const createListingWithTransaction = async function (payload, transaction) {
    return await database.createWithTransaction(
        tables.LISTINGS_TABLE,
        payload,
        transaction,
    );
}

const createUserListingMappingWithTransaction = async function (cityId, userId, listingId, transaction) {
    return await database.createWithTransaction(tables.USER_LISTING_MAPPING_TABLE, {
        cityId,
        userId,
        listingId,
    }, transaction);
}

const getCityListingWithId = async function (id, cityId) {
    const response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows[0];
}

const getCityListingImage = async function (listingId, cityId) {
    const response = await database.get(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        null,
        cityId
    )
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows;
}

const deleteListingImage = async function (listingId, cityId) {
    return await database.deleteData(tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        cityId);
}

const deleteListingImageWithTransaction = async function (listingId, transaction) {
    return await database.deleteDataWithTransaction(tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        transaction
    );
}

const getAllListingsWithFilters = async function (filters, cityId, pageNo, pageSize) {
    const response = await database.get(
        tables.LISTINGS_TABLE,
        filters,
        null,
        cityId,
        pageNo,
        pageSize
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows;
}

const getCityListingsWithFiltersAndPagination = async function (filters, pageNo, pageSize, cities, sortByStartDate) {
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
            SELECT listingId, MIN(logo) as logo, COUNT(listingId) as logoCount
            FROM heidi_city_${city.id}.listing_images
            GROUP BY listingId
        ) sub ON L.id = sub.listingId
        inner join user_cityuser_mapping UM 
        on UM.cityUserId = L.userId AND UM.cityId = ${city.id}
        inner join users U 
        on U.id = UM.userId `;
        if (filters && filters.length > 0) {
            query += "WHERE "
            query += filters.join("AND ");
            query += `GROUP BY L.id,sub.logo, sub.logoCount, U.username, U.firstname, U.lastname, U.image`;
        }
        individualQueries.push(query);
    }

    const query = `select * from (
            ${individualQueries.join(" union all ")}
        ) a order by ${sortByStartDate ? "startDate, createdAt" : "createdAt desc"} LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};`;
    const response = await database.callQuery(query);
    return response.rows;
}

const deleteListingForUserWithTransaction = async (userId, transaction) => {
    await database.deleteDataWithTransaction(
        tables.LISTINGS_TABLE,
        { userId },
        transaction
    );
}

const deleteUserListingMappingWithTransaction = async (userId, transaction) => {
    await database.deleteDataWithTransaction(tables.USER_LISTING_MAPPING_TABLE, {
        userId,
    }, transaction);
}

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
    deleteListingImageWithTransaction,
}