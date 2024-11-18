const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CityUserMappingRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_CITYUSER_MAPPING_TABLE);
    }
}

module.exports = new CityUserMappingRepo();