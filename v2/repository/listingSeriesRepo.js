const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ListingSeriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTING_SERIES_TABLE);
    }
}

module.exports = new ListingSeriesRepo();
