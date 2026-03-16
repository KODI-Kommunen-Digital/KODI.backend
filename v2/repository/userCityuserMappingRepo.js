const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserCityuserMappingRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_CITYUSER_MAPPING_TABLE);
    }
}

module.exports = new UserCityuserMappingRepo();
