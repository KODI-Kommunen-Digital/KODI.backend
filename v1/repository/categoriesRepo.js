const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class CategoriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CATEGORIES_TABLE);
    }
}

module.exports = new CategoriesRepo();
