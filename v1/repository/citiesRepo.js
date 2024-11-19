const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CitiesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITIES_TABLE);
    }
}

module.exports = new CitiesRepo();
