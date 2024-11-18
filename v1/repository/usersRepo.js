const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UsersRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_TABLE);
    }
}

module.exports = new UsersRepo();