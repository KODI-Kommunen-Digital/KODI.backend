const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderDistrictsRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_DISTRICTS);
    }
}

module.exports = new MullkalenderDistrictsRepo();
