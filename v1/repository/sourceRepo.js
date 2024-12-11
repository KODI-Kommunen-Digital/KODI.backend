const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class SourceRepo extends BaseRepo {
    constructor() {
        super(tableNames.SOURCE_TABLE);
    }
}

module.exports = new SourceRepo();
