const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class StatusRepo extends BaseRepo {
    constructor() {
        super(tableNames.E_SERVICES_TABLE);
    }
}

module.exports = new StatusRepo();