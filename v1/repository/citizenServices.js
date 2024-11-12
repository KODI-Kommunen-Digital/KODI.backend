const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getAllCitizenServices = async () => {
    const response = await database.get(tables.CITIZEN_SERVICES_TABLE);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

const getCitizenServiceTitles = async (filterMap) => {
    const response = await database.get(
        tables.CITIZEN_SERVICES_DATA_TABLE,
        filterMap,
        null,
        null,
        null,
        null,
        ["title"],
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
};

module.exports = {
    getAllCitizenServices,
    getCitizenServiceTitles,
};
