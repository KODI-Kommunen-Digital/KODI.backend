const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class ListingsImagesRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_IMAGES_TABLE);
    }
}

module.exports = new ListingsImagesRepo();
