const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class CityUserMappingRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_CITYUSER_MAPPING_TABLE);
    }

    getCityUserCityMapping = async (userId) => {
        const response = await database.callQuery(
            "Select cityId, userId, cityUserId, inCityServer from cities c inner join user_cityuser_mapping m on c.id = m.cityId where userId = ?;",
            [userId],
        );
        if (!response || !response.rows || !response.rows.length) {
            return [];
        }
        return response.rows;
    };

}

module.exports = new CityUserMappingRepo();