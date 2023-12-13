const database = require("../services/database");
const tables = require("../constants/tableNames");

const getFavoritesforUser = async (userId) => {
    const response = await database.get(tables.FAVORITES_TABLE, { userId });
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

const getFavoritesWithFilter = async (filter) => {
    const response = await database.get(tables.FAVORITES_TABLE, filter);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
}

module.exports = {
    getFavoritesforUser,
    getFavoritesWithFilter,
};