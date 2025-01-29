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
}

module.exports = new UserPreferenceCitiesRepo();