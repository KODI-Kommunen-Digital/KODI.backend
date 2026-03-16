const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CityRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITIES_TABLE);
    }
}

module.exports = new CityRepo();