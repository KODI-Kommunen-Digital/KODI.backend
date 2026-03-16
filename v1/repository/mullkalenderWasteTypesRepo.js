const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderWasteTypesRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_WASTE_TYPES);
    }
}

module.exports = new MullkalenderWasteTypesRepo();
