const database = require("./database");
const tables = require("../constants/tableNames");

const getRefreshToken = async function (userId) {
    const refreshToken = await database.get(tables.REFRESH_TOKENS_TABLE, {
        userId,
    });
    if (!refreshToken || !refreshToken.rows || refreshToken.rows.length === 0) {
        return null;
    }
    return refreshToken.rows[0];
}

const getRefreshTokenByRefreshToken = async function (refreshToken) {
    const token = await database.get(tables.REFRESH_TOKENS_TABLE, {
        refreshToken,
    });
    if (!token || !token.rows || token.rows.length === 0) {
        return null;
    }
    return token.rows[0];
}

const deleteRefreshTokenByTokenUid = async function (id) {
    await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
        id,
    });
}

const deleteRefreshTokenByRefreshToken = async function (refreshToken) {
    await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
        refreshToken,
    });
}

const deleteRefreshToken = async function (userId) {
    await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
        userId,
    });
}

const insertRefreshTokenData = async function (payload) {
    const response = await database.create(tables.REFRESH_TOKENS_TABLE, payload);
    return response;
}

module.exports = {
    getRefreshToken,
    deleteRefreshToken,
    insertRefreshTokenData,
    getRefreshTokenByRefreshToken,
    deleteRefreshTokenByTokenUid,
    deleteRefreshTokenByRefreshToken,
}
