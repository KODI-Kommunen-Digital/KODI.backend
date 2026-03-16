const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CitizenServicesDataRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITIZEN_SERVICES_DATA_TABLE);
    }
}

module.exports = new CitizenServicesDataRepo();
