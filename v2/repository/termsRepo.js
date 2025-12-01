const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class TermsRepo extends BaseRepo {
    constructor() {
        super(tableNames.TERMS_TABLE);
    }

    async getLatestActiveTerms() {
        const params = {
            filters: [
                {
                    key: "is_active",
                    sign: "=",
                    value: true,
                },
            ],
            orderBy: ["version"],
            isDescending: true,
        };
        return await this.getOne(params);
    }

    async getTermsByVersion(version) {
        const params = {
            filters: [
                {
                    key: "version",
                    sign: "=",
                    value: version,
                },
            ],
        };
        return await this.getOne(params);
    }
}

module.exports = new TermsRepo();