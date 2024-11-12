const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getCategories = async () => {
    const response = await database.get(
        tables.CATEGORIES_TABLE,
        { isEnabled: true },
        "id, name, noOfSubcategories",
        null,
        null,
        null,
        ["category_order", "id"],
    );
    if (!response || !response.rows || !response.rows.length) {
        return [];
    }
    return response.rows;
};

const getCategoryById = async (id) => {
    const response = await database.get(tables.CATEGORIES_TABLE, { id }, null);
    if (response && response.rows && response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

const getCategoryListingCountForCity = async (cityId) => {
    const query = `SELECT categoryId, COUNT(*) as count FROM heidi_city_${cityId}.listings GROUP BY categoryId;`;
    const response = await database.callQuery(query);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

const getSubCategoriesForCategoryId = async (categoryId) => {
    const response = await database.get(tables.SUBCATEGORIES_TABLE, {
        categoryId,
    });
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

const getCategoryListingCount = async (cityIds) => {
    let query = `SELECT categoryId, COUNT(categoryId) AS totalCount FROM  (`;
    let innerQuery = ``;
    cityIds.forEach((cityId) => {
        innerQuery += `SELECT categoryId FROM heidi_city_${cityId}.listings WHERE statusId = 1 UNION ALL `;
    });
    innerQuery = innerQuery.slice(0, -11);
    query += innerQuery + `) AS combinedResults GROUP BY categoryId;`;

    const response = await database.callQuery(query);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

module.exports = {
    getCategories,
    getCategoryListingCountForCity,
    getCategoryListingCount,
    getSubCategoriesForCategoryId,
    getCategoryById,
};
