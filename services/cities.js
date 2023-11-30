const database = require("./database");
const tables = require("../constants/tableNames");

const getCityWithId = async function (cityId) {
    const response = await database.get(tables.CITIES_TABLE, {
        id: cityId,
    });
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows[0];
}

const getCities = async function (filter) {
    const response = await database.get(tables.CITIES_TABLE, filter, "id,name,image, hasForum", null, null, null, ["name"])
    if (!response || !response.rows) {
        return [];
    }
    return response.rows;
}

module.exports = {
    getCityWithId,
    getCities,
}