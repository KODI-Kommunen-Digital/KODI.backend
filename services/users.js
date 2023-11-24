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

const getUserByUsernameOrEmail = async function (username, email) {
    const users = await database.get(tables.USER_TABLE, {
        username: username,
        email: email,
    }, null, null, null, null, null, null, "OR");
    if (!users || !users.rows || users.rows.length === 0) {
        return null;
    }
    return users.rows[0];
}

const getuserCityMappings = async function (userId) {
    return await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId: userId },
        "cityId, cityUserId"
    );
}

const getRefreshToken = async function (userId) {
    const refreshToken = await database.get(tables.REFRESH_TOKENS_TABLE, {
        userId: userId,
    });
    if (!refreshToken || !refreshToken.rows || refreshToken.rows.length === 0) {
        return null;
    }
    return refreshToken.rows[0];
}

const deleteRefreshToken = async function (userId) {
    await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
        userId: userId,
    });
}

const insertRefreshTokenData = async function (payload) {
    const response = await database.create(tables.REFRESH_TOKENS_TABLE, payload);
    return response;
}

const getUserWithId = async function (userId) {
    const response = await database.get(tables.USER_TABLE, { id: userId }, [
        "id",
        "username",
        "socialMedia",
        "email",
        "website",
        "description",
        "image",
        "firstname",
        "lastname",
        "roleId",
    ]);
    const data = response.rows;
    if(!data || !data.length){
        return null;
    }
    return data[0];
}

const getCityUser = async function (cityId,cityUserId) {
    const cityUsers = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            cityId,
            cityUserId: cityUserId,
        }
    );
    if (!cityUsers.rows || cityUsers.rows.length === 0) {
        return null;
    }
    return cityUsers.rows[0];
}

module.exports = {
    getUserWithUsername,
    getUserWithEmail,
    createUser,
    addVerificationToken,
    getUserByUsernameOrEmail,
    getuserCityMappings,
    getRefreshToken,
    deleteRefreshToken,
    insertRefreshTokenData,
    getUserWithId,
    getCityUser,
}
