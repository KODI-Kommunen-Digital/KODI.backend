const database = require("../utils/database");
const tables = require("../constants/tableNames");

async function getTokensForUser(userId) {
    const tokens = await database.get(tables.FIREBASE_TOKEN, { userId });
    if (!tokens || tokens.rows?.length === 0) {
        return null;
    }
    return tokens.rows.map((token) => token.firebaseToken);
}

module.exports = { getTokensForUser };
