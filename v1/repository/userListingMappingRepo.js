const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserListingMappingRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_LISTING_MAPPING_TABLE);
    }
}

module.exports = new UserListingMappingRepo();
