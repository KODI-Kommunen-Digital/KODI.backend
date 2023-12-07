
const database = require("../services/database");
const tables = require("../constants/tableNames");

const getVillageById = async function (villageId, cityId) {
    const response = await database.get(
        tables.VILLAGE_TABLE,
        { id: villageId },
        null,
        cityId
    );

    const data = response.rows;
    if (data && data.length === 0) {
        return null;
    }
    return data[0];
}

const getCategoryById = async function (categoryId, cityId) {
    const response = await database.get(
        tables.CATEGORIES_TABLE,
        { id: categoryId },
        null,
        cityId
    );
    const data = response.rows;
    if (data && data.length === 0) {
        return null;
    }
    return data[0];
}

const getSubCategoryById = async function (subcategoryId, cityId) {
    const response = await database.get(
        tables.SUBCATEGORIES_TABLE,
        { id: subcategoryId },
        null,
        cityId
    );

    const data = response.rows;
    if (data && data.length === 0) {
        return null;
    }
    return data[0];

}

const getStatusById = async function (statusId, cityId) {
    const response = await database.get(
        tables.STATUS_TABLE,
        { id: statusId },
        null,
        cityId
    );

    const data = response.rows;
    if (data && data.length === 0) {
        return null;
    }
    return data[0];
}

const getCityUserMapping = async function (cityId, userId) {
    const response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            cityId,
            userId,
        }
    );

    const data = response.rows;
    if (data && data.length === 0) {
        return null;
    }
    return data[0];
}

module.exports = {
    getVillageById,
    getCategoryById,
    getSubCategoryById,
    getStatusById,
    getCityUserMapping,
}