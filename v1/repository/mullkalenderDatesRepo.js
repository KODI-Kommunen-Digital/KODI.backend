const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderDatesRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_DATES);
    }
}

module.exports = new MullkalenderDatesRepo();
