const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class StatusRepo extends BaseRepo {
    constructor() {
        super(tableNames.STATUS_TABLE);
    }
}

module.exports = new StatusRepo();