const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ForgotPasswordTokensRepo extends BaseRepo {
    constructor() {
        super(tableNames.FORGOT_PASSWORD_TOKENS_TABLE);
    }
}

module.exports = new ForgotPasswordTokensRepo();
