const database = require("./database");
const tables = require("../constants/tableNames");

const getUserWithUsername = async function (username) {
    const response = await database.get(tables.USER_TABLE, {
        username: username,
    });
    const data = response.rows;
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

const getUserWithEmail = async function (email) {
    const response = await database.get(tables.USER_TABLE, {
        email: email,
    });
    const data = response.rows;
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

const createUser = async function (payload, connection) {
    const response = await database.createWithTransaction(
        tables.USER_TABLE,
        payload,
        connection
    );
    return response;
}

const addVerificationToken = async function (payload, connection) {
    const response = await database.createWithTransaction(
        tables.VERIFICATION_TOKENS_TABLE,
        payload,
        connection
    );
    return response;
}

module.exports = {
    getUserWithUsername,
    getUserWithEmail,
    createUser,
    addVerificationToken,
}
