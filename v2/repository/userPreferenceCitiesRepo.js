const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserPreferenceCitiesRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_PREFERENCE_CITIES_TABLE);
    }
}

module.exports = new UserPreferenceCitiesRepo();