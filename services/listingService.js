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


module.exports = {
    createListingWithTransaction,
    createUserListingMappingWithTransaction,
}