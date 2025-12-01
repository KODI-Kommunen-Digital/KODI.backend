const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserTermsRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_TERMS_TABLE);
    }

    /* eslint-disable camelcase */
    async getUserAcceptedVersion(userId) {
        const params = {
            filters: [
                {
                    // eslint-disable-next-line camelcase
                    key: "device_id",
                    sign: "=",
                    value: userId,
                },
            ],
            // eslint-disable-next-line camelcase
            orderBy: ["version_accepted"]
        };
        return await this.getOne(params);
    }
    /* eslint-disable camelcase */

    /* eslint-disable camelcase */
    async hasUserAcceptedVersion(userId, version) {
        const params = {
            filters: [
                {
                    key: "device_id",
                    sign: "=",
                    value: userId,
                },
                {
                    key: "version_accepted",
                    sign: "=",
                    value: version,
                },
            ],
        };
        const result = await this.getOne(params);
        return result !== null;
    }
    /* eslint-disable camelcase */

    /* eslint-disable camelcase */
    async createUserAcceptance(userId, version) {
        const params = {
            data: {
                device_id: userId,
                version_accepted: version,
            },
        };
        return await this.create(params);
    }
    /* eslint-disable camelcase */

}

module.exports = new UserTermsRepo();