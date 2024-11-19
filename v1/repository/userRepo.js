const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../services/database");
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

}

module.exports = new UserRepo();
