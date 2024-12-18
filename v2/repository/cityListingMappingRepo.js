const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CityListingMappingRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITY_LISTING_MAPPING_TABLE);
    }
}

module.exports = new CityListingMappingRepo();
