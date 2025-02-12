const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");
const storedProcedures = require("../constants/storedProcedures");
class UserRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_TABLE);
    }

    // implement transaction
    deleteCityUserProcedure = async (userId, cityId) => {
        await database.callStoredProcedure(
            storedProcedures.DELETE_CITY_USER,
            [userId],
            cityId,
        );
    }

    deleteCoreUserProcedure = async (userId) => {
        await database.callStoredProcedure(storedProcedures.DELETE_CORE_USER, [
            userId,
        ]);
    }

    getUsersForNotification = async (cityId, categoryId) => {
        const query = `SELECT DISTINCT u.id AS userId FROM users u
            JOIN user_preference_cities upc ON u.id = upc.userId
            JOIN user_preference_categories upcat ON u.id = upcat.userId
            WHERE upc.cityId IN (?) AND upcat.categoryId = ?;
        `;
        const response = await database.callQuery(query, [cityId, categoryId]);
        return response.rows;
    }

    getUsersForNotificationWithUserFilter = async (cityId, categoryId, userIds) => {
        const query = `SELECT DISTINCT u.id AS userId FROM users u
            JOIN user_preference_cities upc ON u.id = upc.userId
            JOIN user_preference_categories upcat ON u.id = upcat.userId
            WHERE upc.cityId IN (?) 
            AND upcat.categoryId = ? 
            AND u.id IN (?);`;
        const response = await database.callQuery(query, [cityId, categoryId, userIds]);
        return response.rows;
    }

}

module.exports = new UserRepo();