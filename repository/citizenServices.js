const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getAllCitizenServices = async () => {
    const response = await database.get(tables.CITIZEN_SERVICES_TABLE);
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
}

const getDigitalManagement = async (cityId) => {
    let response = null;
    if (!cityId) {
        response = await database.get(tables.DIGITAL_MANAGEMENT_TABLE);
    } else {
        response = await database.get(tables.DIGITAL_MANAGEMENT_TABLE, { cityId });
    }
    if (!response || !response.rows || response.rows.length === 0) {
        return [];
    }
    return response.rows;
}

module.exports = {
    getAllCitizenServices,
    getDigitalManagement,
};
