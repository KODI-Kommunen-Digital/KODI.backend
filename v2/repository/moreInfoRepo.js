const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MoreInfoRepo extends BaseRepo {
    constructor() {
        super(tableNames.MORE_INFO_TABLE);
    }
}

module.exports = new MoreInfoRepo();
