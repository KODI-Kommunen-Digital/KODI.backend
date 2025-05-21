const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");
const AppError = require("../utils/appError");

class ListingChatsRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_CHATS_TABLE);
    }

    async getChats(params) {
        const { listingId, lastMessageId, isReversed, pageNo, pageSize } = params
        try {
            let query;
            const params = [listingId];
            query = `
                SELECT * from ${tableNames.LISTINGS_CHATS_TABLE}
                WHERE listingId = ? 
            `;
            if (lastMessageId) {
                query += ` AND id > ?`;
                params.push(lastMessageId);
            }
            query += ` ORDER BY id ${isReversed ? "DESC" : "ASC"}`;
            if (pageSize && pageNo) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(Number(pageSize));
                const offset = (pageNo - 1) * pageSize;
                params.push(offset);
            }
            const response = await database.callQuery(query, params);
            return response.rows;
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(err);
        }
    }

}

module.exports = new ListingChatsRepo();
