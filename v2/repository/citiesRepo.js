const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class CitiesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITIES_TABLE);
    }

    getUserCityMapping = async (userId) => {
        const mappings = await database.callQuery(
            "SELECT cityId, userId, cityUserId, inCityServer FROM cities c INNER JOIN user_cityuser_mapping m ON c.id = m.cityId WHERE userId = ?;",
            [userId]
        );
        return mappings.rows;
    }
}

module.exports = new CitiesRepo();
