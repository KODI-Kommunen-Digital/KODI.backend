const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");
const AppError = require("../utils/appError");

class ListingChatsRepo extends BaseRepo {
    constructor() {
        super(tableNames.LISTINGS_CHATS_TABLE);
    }

    async getChats(params) {
        const { listingId, lastMessageId, isReversed, pageNo, pageSize } = params;
        try {
            let query;
            const values = [listingId];
            query = `
            SELECT
                lc.*,
                u.username AS senderName,
                u.firstname as firstname,
                u.lastname as lastname,
                parent.message AS parentMessage,
                parentUser.username AS parentUsername,
                COALESCE(r.reactions, JSON_ARRAY()) AS reactions
                FROM listing_chats lc
                INNER JOIN users u ON lc.senderId = u.id
                LEFT JOIN listing_chats parent ON lc.parentId = parent.id
                LEFT JOIN users parentUser ON parent.senderId = parentUser.id
                LEFT JOIN (
                    SELECT
                        chatId,
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'userId', userId,
                                'username', ur.username,
                                'reaction', CASE lcr.reaction
                                            WHEN 'like' THEN 1
                                            WHEN 'dislike' THEN 2
                                            ELSE NULL
                                        END
                            )
                        ) AS reactions
                    FROM listing_chat_reactions lcr
                    INNER JOIN users ur ON lcr.userId = ur.id
                    GROUP BY lcr.chatId
                ) r ON lc.id = r.chatId
            WHERE lc.listingId = ?
        `;

            if (lastMessageId) {
                query += ` AND lc.id > ?`;
                values.push(lastMessageId);
            }

            query += `
            GROUP BY lc.id
            ORDER BY lc.id ${isReversed ? "DESC" : "ASC"}
        `;

            if (pageSize && pageNo) {
                query += ` LIMIT ? OFFSET ?`;
                values.push(Number(pageSize));
                values.push((pageNo - 1) * pageSize);
            }
            console.log({ query })
            const response = await database.callQuery(query, values);
            return response.rows;
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(err);
        }
    }

    async getAdminParticipants(listingId) {
        try {
            const query = `
                SELECT DISTINCT u.id, u.username, u.firstname, u.lastname
                FROM listing_chats lc
                INNER JOIN users u ON lc.senderId = u.id
                WHERE lc.listingId = ?
                AND lc.senderType = 'admin'
                ORDER BY u.id
            `;
            const values = [listingId];
            const response = await database.callQuery(query, values);
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
