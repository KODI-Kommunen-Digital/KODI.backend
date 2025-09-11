const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class AdminRepo extends BaseRepo {
    constructor() {
        super(tableNames.ONBOARD_USER_TABLE);
    }
}
module.exports = new AdminRepo();
