const { get,
    create,
    update,
    deleteData,
    // callStoredProcedure,
    // callQuery,
    createTransaction,
    commitTransaction,
    rollbackTransaction,
    createWithTransaction,
    updateWithTransaction,
    deleteDataWithTransaction
} = require("../utils/database");

class BaseRepo {
    constructor(table) {
        this.tableName = table;
    }

    async getOne(params) {
        const { columns, filters, joinFiltersBy, orderBy, cityId } = params;
        const response = await get(this.tableName, filters, columns, cityId, 1, 1, orderBy, null, joinFiltersBy);
        if (!response || !response.rows || response.rows.length === 0) {
            return null;
        }
        return response.rows[0];
    }

    async getAll(params = {}) {
        const { columns, filters, pageNo, pageSize, orderBy, isDescending, joinFiltersBy, cityId } = params;
        const response = await get(this.tableName, filters, columns, cityId, pageNo, pageSize, orderBy, isDescending, joinFiltersBy);
        return { rows: response.rows, count: response.totalCount };
    }

    async update(params) {
        const { data, filters, joinFiltersBy, cityId } = params;

        return await update(this.tableName, data, filters, cityId, joinFiltersBy);
    }

    async create(params) {
        const { data, cityId } = params;

        return await create(this.tableName, data, cityId);
    }

    async delete(params) {
        const { cityId, filters, joinFiltersBy } = params;

        return await deleteData(this.tableName, filters, cityId, joinFiltersBy);
    }

    async createTransaction(cityId) {
        return await createTransaction(cityId);
    }

    async commitTransaction(connection) {
        await commitTransaction(connection);
    }

    async rollbackTransaction(connection) {
        await rollbackTransaction(connection);
    }

    // add cityIds
    async createWithTransaction(params, transaction) {
        const { data } = params;

        return await createWithTransaction(this.tableName, data, transaction);
    }

    async updateWithTransaction(params, transaction) {
        const { data, filters, joinFiltersBy } = params;

        return await updateWithTransaction(this.tableName, data, filters, transaction, joinFiltersBy);
    }

    async deleteWithTransaction(params, transaction) {
        const { filters, joinFiltersBy } = params;

        return await deleteDataWithTransaction(this.tableName, filters, transaction, joinFiltersBy);
    }
}

module.exports = BaseRepo;
