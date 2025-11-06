const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class PermissionsRepo extends BaseRepo {
    constructor() {
        super(tableNames.PERMISSIONS_TABLE);
    }
}

module.exports = new PermissionsRepo();


