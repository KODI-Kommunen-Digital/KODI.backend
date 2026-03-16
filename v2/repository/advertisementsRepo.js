const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class AdvertisementsRepo extends BaseRepo {
    constructor() {
        super(tableNames.ADVERTISEMENTS);
    }
}

module.exports = new AdvertisementsRepo();
