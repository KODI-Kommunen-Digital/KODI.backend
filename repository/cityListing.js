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

const getCountByCategory = async function (cityId, categoryName) {
    const query = `SELECT COUNT(LI.id) AS LICount FROM heidi_city_${cityId}.listing_images LI WHERE LI.logo LIKE '%${categoryName}%'`;
    const result = await this.database.callQuery(query);
    return result.rows.length > 0 ? result.rows[0].LICount : 0;
}

const createListingImage = async function (cityId, listingId, imageOrder, logo) {
    const data = { listingId, imageOrder, logo };
    return await this.database.create(tables.LISTINGS_IMAGES_TABLE, data, cityId);
}

const deleteListingImage = async function (listingId, cityId) {
    await database.deleteData(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        cityId,
    );
}

const deleteListingImageWithTransaction = async function (listingId, transaction) {
    await database.deleteDataWithTransaction(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        transaction,
    );
}

const deleteListingImageById = async function (id, cityId) {
    await database.deleteData(
        tables.LISTINGS_IMAGES_TABLE,
        { id },
        cityId,
    );
}

const getListingImages = async function (listingId, cityId) {
    const response = await database.get(
        tables.LISTINGS_IMAGES_TABLE,
        { listingId },
        null,
        cityId
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows;
}

const updateListingImage = async function (id, payload, cityId) {
    return await database.update(
        tables.LISTINGS_IMAGES_TABLE,
        payload,
        { id },
        cityId
    );
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
    getCountByCategory,
    deleteListingImage,
    createListingImage,
    getListingImages,
    deleteListingImageById,
    updateListingImage,
    deleteListingImageWithTransaction,
}