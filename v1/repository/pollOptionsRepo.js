const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class PollOptionsRepo extends BaseRepo {
    constructor() {
        super(tableNames.POLL_OPTIONS_TABLE);
    }
}

module.exports = new PollOptionsRepo();
