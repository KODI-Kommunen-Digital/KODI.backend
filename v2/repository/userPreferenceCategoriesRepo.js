const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserPreferenceCategoriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_PREFERENCE_CATEGORIES_TABLE);
    }
}

module.exports = new UserPreferenceCategoriesRepo();