const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserChatbotChatsRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_CHATBOT_CHATS_TABLE);
    }

    async getChatsBySessionId(sessionId, userId) {
        return this.getAll({ filters: [{ key: "sessionId", sign: "=", value: sessionId }] });
    }
}

module.exports = new UserChatbotChatsRepo(); 