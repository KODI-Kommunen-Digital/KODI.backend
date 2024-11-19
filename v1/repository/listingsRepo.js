const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ListingsRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_TABLE);
    }
}

module.exports = new ListingsRepo();
