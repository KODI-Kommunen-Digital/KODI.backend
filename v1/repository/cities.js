const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getCityWithId = async function (cityId) {
    const response = await database.get(tables.CITIES_TABLE, {
        id: cityId,
    });
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows[0];
};

const getCities = async function (
    filter,
    columns = "id,name,image, hasForum",
    sort = ["name"],
) {
    const response = await database.get(
        tables.CITIES_TABLE,
        filter,
        columns,
        null,
        null,
        null,
        sort,
    );
    if (!response || !response.rows) {
        return [];
    }
    return response.rows;
};

const createCityUserCityMappingWithTransaction = async function (
    cityId,
    userId,
    cityUserId,
    transaction,
) {
    await database.createWithTransaction(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            cityId,
            userId,
            cityUserId,
        },
        transaction,
    );
};

const getCityUserCityMapping = async (userId) => {
    const response = await database.callQuery(
        "Select cityId, userId, cityUserId, inCityServer from cities c inner join user_cityuser_mapping m on c.id = m.cityId where userId = ?;",
        [userId],
    );
    if (!response || !response.rows || !response.rows.length) {
        return [];
    }
    return response.rows;
};

const deleteCityUserCityMappingWithTransaction = async function (
    userId,
    transaction,
) {
    await database.deleteDataWithTransaction(
        tables.USER_CITYUSER_MAPPING_TABLE,
        {
            userId,
        },
        transaction,
    );
};

module.exports = {
    getCityWithId,
    getCities,
    createCityUserCityMappingWithTransaction,
    getCityUserCityMapping,
    deleteCityUserCityMappingWithTransaction,
};
