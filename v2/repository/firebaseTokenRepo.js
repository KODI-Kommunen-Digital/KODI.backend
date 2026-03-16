const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class FirebaseTokenRepo extends BaseRepo {
    constructor() {
        super(tableNames.FIREBASE_TOKEN_TABLE);
    }
}

module.exports = new FirebaseTokenRepo();