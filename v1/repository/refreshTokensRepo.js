const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class RefreshTokensRepo extends BaseRepo {
    constructor() {
        super(tableNames.REFRESH_TOKENS_TABLE);
    }
}

module.exports = new RefreshTokensRepo();
