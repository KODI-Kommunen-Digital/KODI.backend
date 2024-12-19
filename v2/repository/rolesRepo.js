const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class RolesRepo extends BaseRepo {
    constructor() {
        super(tableNames.ROLES_TABLE);
    }
}

module.exports = new RolesRepo();
