const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class SubcategoriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.SUBCATEGORIES_TABLE);
    }
}

module.exports = new SubcategoriesRepo();
