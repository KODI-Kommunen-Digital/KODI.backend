const database = require("../utils/database");
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
    const cityUsers = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId },
        "cityId, cityUserId"
    );
    if (!cityUsers || !cityUsers.rows || cityUsers.rows.length === 0) {
        return [];
    }
    return cityUsers.rows;
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

const getAllUsers = async function (filter, columns) {
    const response = await database.get(tables.USER_TABLE, filter, columns)
    if (!response) {
        return [];
    }
    return response.rows;
}

const getUserById = async function (userId) {
    const response = await database.get(tables.USER_TABLE, { id: userId });
    const data = response.rows;
    if (data && data.length === 0) {
        return null;

    }
    return data[0];
}

const createCityUserWithTransaction = async function (user, transaction) {
    const response = await database.createWithTransaction(
        tables.USER_TABLE,
        user,
        transaction,
    );
    return response;
}

const getCityUserCityMapping = async function (cityId, userId) {
    const response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            cityId,
            userId,
        }
    );
    const data = response.rows;
    if (data && data.length === 0) {
        return null;
    }
    return data[0];
}


const getUserListingsFromDatabase = async function (userId, filters, cityMappings, pageNo, pageSize) {
    const individualQueries = [];
    for (const cityMapping of cityMappings) {
        // let query = `SELECT *, ${cityMapping.cityId} as cityId 
        // FROM heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."}listings 
        // WHERE userId = ${cityMapping.cityUserId}`;
        const listingImageTableName = `heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."}listing_images LI_${cityMapping.cityId}`;
        const cityListAlias = `L_${cityMapping.cityId}`;
        let query = `SELECT  
        sub.logo,
        sub.logoCount,
        ${cityListAlias}.*, ${cityMapping.cityId} as cityId,
        otherLogos FROM heidi_city_${cityMapping.cityId}${cityMapping.inCityServer ? "_" : "."}listings ${cityListAlias}
        LEFT JOIN (
            SELECT
                listingId,
                MAX(CASE WHEN imageOrder = 1 THEN logo ELSE NULL END) as logo,
                COUNT(*) as logoCount
            FROM ${listingImageTableName}
            GROUP BY listingId
        ) sub ON ${cityListAlias}.id = sub.listingId
        LEFT JOIN (
            SELECT
                listingId,
                JSON_ARRAYAGG(JSON_OBJECT('logo', logo, 'imageOrder', imageOrder,'id',id,'listingId', listingId )) as otherLogos
            FROM ${listingImageTableName}
            GROUP BY listingId
        ) other ON ${cityListAlias}.id = other.listingId
        WHERE ${cityListAlias}.userId = ${cityMapping.cityUserId}`;

        if (filters.categoryId || filters.statusId) {
            if (filters.categoryId) {
                query += ` AND ${cityListAlias}.categoryId = ${filters.categoryId}`;
            }
            if (filters.subCategoryId) {
                query += ` AND ${cityListAlias}.subCategoryId = ${filters.subCategoryId}`;
            }
            if (filters.statusId) {
                query += ` AND ${cityListAlias}.statusId = ${filters.statusId}`;
            }
        }
        individualQueries.push(query);
    }
    if (individualQueries && individualQueries.length > 0) {
        const query = `select * from (
            ${individualQueries.join(" union all ")}
        ) a order by createdAt desc LIMIT ${(pageNo - 1) * pageSize}, ${pageSize};`;
        const response = await database.callQuery(query);
        if (!response || !response.rows) {
            return [];
        }
        return response.rows;
    }
    return [];
}

const deleteUserWithTransaction = async (id, transaction) => {
    await database.deleteDataWithTransaction(
        tables.USER_TABLE,
        { id },
        transaction
    );
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
    addForgotPasswordTokenWithConnection,
    getAllUsers,
    getUserById,
    createCityUserWithTransaction,
    getCityUserCityMapping,
    getUserListingsFromDatabase,
    deleteUserWithTransaction,
}
