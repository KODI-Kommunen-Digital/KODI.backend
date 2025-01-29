const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class UserPreferenceCitiesRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_PREFERENCE_CITIES_TABLE);
    }

    getuserCityPreference = async (userId) => {
        const respCities = await database.callQuery(
            `SELECT c.id, c.name, IF(uc.userId IS NULL, false, true) AS enabled FROM cities c
            LEFT JOIN user_preference_cities uc ON c.id = uc.cityId AND uc.userId = ?`,
            [userId]
        );
        return respCities.rows;
    }

    insertCityPreferenceUnique = async (userId, cityId ) => {
        const response= await database.callQuery(
            `INSERT INTO user_preference_cities (userId, cityId) VALUES (?, ?) ON DUPLICATE KEY UPDATE cityId = cityId`,
            [userId, cityId]
        );
        return response.rows;
    }

    insertMultipleCityPreference = async (data) => {
        const columns = Object.keys(data[0]);
        const placeholders = data.map(() => "(?, ?)").join(", ");
        const values = data.flatMap(obj => columns.map(col => obj[col]));
        const query = `INSERT INTO user_preference_cities (${columns.join(", ")}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE cityId=cityId`;
        const response = await database.callQuery(query, values);
        return response.rows;
    }
}

module.exports = new UserPreferenceCitiesRepo();