const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getVillageById = async function (villageId, cityId) {
    const response = await database.get(
        tables.VILLAGE_TABLE,
        { id: villageId },
        null,
        cityId
    );

    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];
}

const getCategoryById = async function (categoryId, cityId) {
    const response = await database.get(
        tables.CATEGORIES_TABLE,
        { id: categoryId },
        null,
        cityId
    );
    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];
}

const getSubCategoryById = async function (subcategoryId, cityId) {
    const response = await database.get(
        tables.SUBCATEGORIES_TABLE,
        { id: subcategoryId },
        null,
        cityId
    );

    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];
}

const getSubCategoryWithFilter = async function (filters, cityId) {
    const response = await database.get(
        tables.SUBCATEGORIES_TABLE,
        filters,
        null,
        cityId
    );

    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];
}

const getSubCategory = async function (filters, cityId) {
    const response = await database.get(
        tables.SUBCATEGORIES_TABLE,
        filters,
        null,
        cityId
    );

    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];

}

const getStatusById = async function (statusId, cityId) {
    const response = await database.get(
        tables.STATUS_TABLE,
        { id: statusId },
        null,
        cityId
    );

    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];
}

const getCityUserMapping = async function (cityId, userId) {
    const response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            cityId,
            userId,
        }
    );

    if (!response || !response.rows || !response.rows.length) {
        return null;
    }
    return response.rows[0];
}

const updateCityListing = async function (listingId, payload, cityId) {
    return await database.update(
        tables.LISTINGS_TABLE,
        payload,
        { id: listingId },
        cityId
    );
}

const deleteCityListing = async function (id, cityId) {
    return database.deleteData(tables.LISTINGS_TABLE, { id }, cityId);
}

module.exports = {
    getVillageById,
    getCategoryById,
    getSubCategoryById,
    getStatusById,
    getCityUserMapping,
    getSubCategory,
    updateCityListing,
    deleteCityListing,
    getSubCategoryWithFilter,
}