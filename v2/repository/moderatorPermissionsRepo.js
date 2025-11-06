const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ModeratorPermissionsRepo extends BaseRepo {
    constructor() {
        super(tableNames.MODERATOR_PERMISSIONS_TABLE);
    }
}

module.exports = new ModeratorPermissionsRepo();


