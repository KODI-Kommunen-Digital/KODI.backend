const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderStreetPropertiesHouseRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_STREET_PROPERTIES_HOUSE);
    }
}

module.exports = new MullkalenderStreetPropertiesHouseRepo();
