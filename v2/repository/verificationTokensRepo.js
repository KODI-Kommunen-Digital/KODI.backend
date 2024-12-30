const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class VerificationTokensRepo extends BaseRepo {
    constructor() {
        super(tableNames.VERIFICATION_TOKENS_TABLE);
    }
}

module.exports = new VerificationTokensRepo();
