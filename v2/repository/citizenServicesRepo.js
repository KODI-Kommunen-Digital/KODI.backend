const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CitizenServicesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITIZEN_SERVICES_TABLE);
    }
}

module.exports = new CitizenServicesRepo();
