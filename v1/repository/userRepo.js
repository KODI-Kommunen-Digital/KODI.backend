const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_TABLE);
    }
}

module.exports = new UserRepo();
