const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class TokenRepo extends BaseRepo {
    constructor() {
        super(tableNames.REFRESH_TOKENS_TABLE);
    }
}

module.exports = new TokenRepo();