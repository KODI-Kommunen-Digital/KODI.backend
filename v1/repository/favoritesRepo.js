const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class FavoritesRepo extends BaseRepo {
    constructor() {
        super(tableNames.FAVORITES_TABLE);
    }
}

module.exports = new FavoritesRepo();
