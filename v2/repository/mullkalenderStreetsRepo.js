const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderStreetsRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_STREETS);
    }
}

module.exports = new MullkalenderStreetsRepo();
