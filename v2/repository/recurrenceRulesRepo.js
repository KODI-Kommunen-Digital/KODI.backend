const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class RecurrenceRulesRepo extends BaseRepo {
    constructor() {
        super(tableNames.RECURRENCE_RULES_TABLE);
    }

    /**
     * Get all recurrence rules by listing ID
     * @param {number} listingId 
     * @returns {Promise<Array>}
     */
    async getAllByListingId(listingId) {
        const result = await this.getAll({
            filters: [{ key: "listingId", sign: "=", value: listingId }]
        });
        return result.rows || [];
    }

    /**
     * Get single recurrence rule by listing ID (for backwards compatibility)
     * @param {number} listingId 
     * @returns {Promise<Object|null>}
     */
    async getByListingId(listingId) {
        return await this.getOne({
            filters: [{ key: "listingId", sign: "=", value: listingId }]
        });
    }

    /**
     * Delete recurrence rule by listing ID with transaction support
     * @param {number} listingId 
     * @param {Object} transaction 
     */
    async deleteByListingIdWithTransaction(listingId, transaction) {
        return await this.deleteWithTransaction({
            filters: [{ key: "listingId", sign: "=", value: listingId }]
        }, transaction);
    }
}

module.exports = new RecurrenceRulesRepo();
