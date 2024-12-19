const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class DefectReportsRepo extends BaseRepo {
    constructor() {
        super(tableNames.DEFECT_REPORTS);
    }
}

module.exports = new DefectReportsRepo();
