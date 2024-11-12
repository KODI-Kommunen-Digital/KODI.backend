const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getStatuses = async function () {
    const response = await database.get(tables.STATUS_TABLE);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

const getStatusById = async function (id) {
    const response = await database.get(tables.STATUS_TABLE, { id });
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows[0];
};

module.exports = {
    getStatuses,
    getStatusById,
};
