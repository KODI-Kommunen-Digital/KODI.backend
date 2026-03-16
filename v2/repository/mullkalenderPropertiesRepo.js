const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class MullkalenderPropertiesRepo extends BaseRepo {
    constructor() {
        super(tableNames.MULLKALENDER_PROPERTIES);
    }
}

module.exports = new MullkalenderPropertiesRepo();
