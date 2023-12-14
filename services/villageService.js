const database = require("../services/database");
const tables = require("../constants/tableNames");

const getVillageForCity = async (cityId) => {
    const villages = await database.get(tables.VILLAGE_TABLE, null, null, cityId)
    if (!villages || !villages.rows || villages.rows.length === 0) {
        return [];
    }
    return villages.rows;
}

module.exports = {
    getVillageForCity,
}