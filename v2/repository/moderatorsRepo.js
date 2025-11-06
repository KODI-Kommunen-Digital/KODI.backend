const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ModeratorsRepo extends BaseRepo {
    constructor() {
        super(tableNames.MODERATORS_TABLE);
    }
}

module.exports = new ModeratorsRepo();


