const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class VillageRepo extends BaseRepo {
    constructor() {
        super(tableNames.VILLAGE_TABLE);
    }
}

module.exports = new VillageRepo();
