const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class RecurrenceExceptionsRepo extends BaseRepo {
    constructor() {
        super(tableNames.RECURRENCE_EXCEPTIONS_TABLE);
    }

    /**
     * Get all exceptions for a recurrence rule
     * @param {number} ruleId 
     * @returns {Promise<{rows: Array, count: number}>}
     */
    async getByRuleId(ruleId) {
        return await this.getAll({
            filters: [{ key: "recurrenceRuleId", sign: "=", value: ruleId }]
        });
    }
}

module.exports = new RecurrenceExceptionsRepo();
