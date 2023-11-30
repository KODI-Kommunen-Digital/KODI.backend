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

const getForgotPasswordToken = async function (userId, token) {
    const forgotPasswordToken = await database.get(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
        userId,
        token,
    });
    if (!forgotPasswordToken || !forgotPasswordToken.rows || forgotPasswordToken.rows.length === 0) {
        return null;
    }
    return forgotPasswordToken.rows[0];
}

const deleteForgotPasswordToken = async function (userId, token) {
    await database.deleteData(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
        userId,
        token,
    });
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

const deleteRefreshTokenFor = async function (payload) {
    await database.deleteData(tables.REFRESH_TOKENS_TABLE, payload);
}

const insertRefreshTokenData = async function (payload) {
    const response = await database.create(tables.REFRESH_TOKENS_TABLE, payload);
    return response;
}
const insertVerificationTokenData = async function (payload) {
    const response = await database.create(tables.VERIFICATION_TOKENS_TABLE, payload);
    return response;
}
const getEmailVerificationToken = async function (userId, token) {
    const emailVerificationToken = await database.get(tables.VERIFICATION_TOKENS_TABLE, {
        userId,
        token,
    });
    if (!emailVerificationToken || !emailVerificationToken.rows || emailVerificationToken.rows.length === 0) {
        return null;
    }
    return emailVerificationToken.rows[0];
}
const deleteVerificationToken = async function (payload) {
    await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, payload);
}


module.exports = {
    getRefreshToken,
    deleteRefreshToken,
    insertRefreshTokenData,
    getRefreshTokenByRefreshToken,
    deleteRefreshTokenByTokenUid,
    deleteRefreshTokenByRefreshToken,
    getForgotPasswordToken,
    deleteForgotPasswordToken,
    insertVerificationTokenData,
    getEmailVerificationToken,
    deleteVerificationToken,
    deleteRefreshTokenFor

}
