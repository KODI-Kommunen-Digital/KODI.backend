const database = require("../services/database");
const tables = require("../constants/tableNames");

const getAllCitizenServices = async () => {
    const response = await database.get(tables.CITIZEN_SERVICES_TABLE);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
}

module.exports = {
    getAllCitizenServices,
};
