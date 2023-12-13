const database = require("../services/database");
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
        let query = `SELECT L.*, U.username, U.firstname, U.lastname, U.image, U.id as coreUserId, ${city.id} 
        as cityId FROM heidi_city_${city.id}${city.inCityServer ? "_" : "."}listings L 
        inner join
        user_cityuser_mapping UM on UM.cityUserId = L.userId AND UM.cityId = ${city.id}
        inner join users U on U.id = UM.userId `;
        if (filters.categoryId || filters.statusId) {
            query += " WHERE ";
            if (filters.categoryId) {
                query += `L.categoryId = ${filters.categoryId} AND `;
            }
            if (filters.subcategoryId) {
                query += `L.subcategoryId = ${filters.subcategoryId} AND `;
            }
            if (filters.statusId) {
                query += `L.statusId = ${filters.statusId} AND `;
            }
            query = query.slice(0, -4);
        }
        individualQueries.push(query);
    }

    const query = `select * from (
            ${individualQueries.join(" union all ")}
        ) a order by ${sortByStartDate ? "startDate, createdAt" : "createdAt desc"} LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};`;
    const response = await database.callQuery(query);
    return response.rows;
}

module.exports = {
    createListingWithTransaction,
    createUserListingMappingWithTransaction,
    getCityListingWithId,
    getAllListingsWithFilters,
    getCityListingsWithFiltersAndPagination,
}