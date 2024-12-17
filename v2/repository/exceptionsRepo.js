const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ExceptionsRepo extends BaseRepo {
    constructor() {
        super(tableNames.EXCEPTIONS_TABLE);
    }
}

module.exports = new ExceptionsRepo();
