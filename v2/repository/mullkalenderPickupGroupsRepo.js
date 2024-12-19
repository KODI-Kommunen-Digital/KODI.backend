const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderPickupGroupsRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_PICKUP_GROUPS);
    }
}

module.exports = new MullkalenderPickupGroupsRepo();
