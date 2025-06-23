const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");

class UserChatbotSessionsRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_CHATBOT_SESSIONS_TABLE);
    }

    async getSessionsByUserId(userId) {
        return this.getAll({ key: "user_id", sign: "=", value: userId });
    }
}

module.exports = new UserChatbotSessionsRepo(); 