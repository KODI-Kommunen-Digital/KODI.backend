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


module.exports = {
    createListingWithTransaction,
    createUserListingMappingWithTransaction,
    getCityListingWithId,
}