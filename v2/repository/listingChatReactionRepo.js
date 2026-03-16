const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
// const database = require("../utils/database");
// const AppError = require("../utils/appError");

class ListingChatsRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_CHAT_REACTIONS_TABLE);
    }
}

module.exports = new ListingChatsRepo();
