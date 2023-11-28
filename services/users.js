const database = require("./database");
const tables = require("../constants/tableNames");

const getUserWithUsername = async function (username) {
    const response = await database.get(tables.USER_TABLE, {
        username
    });
    const data = response.rows;
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

const getUserWithEmail = async function (email) {
    const response = await database.get(tables.USER_TABLE, {
        email,
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
        username,
        email,
    }, null, null, null, null, null, null, "OR");
    if (!users || !users.rows || users.rows.length === 0) {
        return null;
    }
    return users.rows[0];
}

const getuserCityMappings = async function (userId) {
    return await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId },
        "cityId, cityUserId"
    );
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
    if (!data || !data.length) {
        return null;
    }
    return data[0];
}

const getCityUser = async function (cityId, cityUserId) {
    const cityUsers = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            cityId,
            cityUserId,
        }
    );
    if (!cityUsers.rows || cityUsers.rows.length === 0) {
        return null;
    }
    return cityUsers.rows[0];
}

const getUserDataById = async function (userId) {
    const response = await database.get(tables.USER_TABLE, { id: userId });
    if (!response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows[0];
}

const updateUserById = async function (userId, payload) {
    await database.update(tables.USER_TABLE, payload, { id: userId });

}

const deleteForgotTokenForUserWithConnection = async function (userId, connection) {
    await database.deleteDataWithTransaction(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
        userId,
    }, connection);
}

const addForgotPasswordTokenWithConnection = async function (payload, connection) {
    const response = await database.createWithTransaction(
        tables.FORGOT_PASSWORD_TOKENS_TABLE,
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
    getUserByUsernameOrEmail,
    getuserCityMappings,
    getUserWithId,
    getCityUser,
    getUserDataById,
    updateUserById,
    deleteForgotTokenForUserWithConnection,
    addForgotPasswordTokenWithConnection
}
