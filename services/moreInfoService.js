
const database = require("../services/database");
const tables = require("../constants/tableNames");

const getMoreInfoService = async function () {
    const response = await database.get(tables.MORE_INFO_TABLE)
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
}

module.exports = {
    getMoreInfoService,
};