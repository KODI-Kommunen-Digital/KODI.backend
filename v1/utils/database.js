const { getConnection } = require("./mysql");

// In all these functions, if cityId is given, we connect to that city's database. Else, we connect to the core database
async function get(
    tableName,
    filters,
    columns,
    cityId,
    pageNo,
    pageSize,
    orderBy,
    descending,
    joinFiltersBy = "AND",
) {
    const connection = await getConnection(cityId);
    let query = `SELECT ${columns ?? '*'} FROM ${tableName} `;
    let countQuery = `SELECT COUNT(*) AS totalCount FROM ${tableName} `;
    let queryParams;
    ({ queryParams, query, countQuery } = buildQueryWithFilters(filters, query, countQuery, joinFiltersBy));

    if (orderBy && orderBy.length > 0) {
        query += `ORDER BY ${orderBy.join(", ")} ${descending ? "DESC" : "ASC"} `;
    }

    if (pageNo > 0 && pageSize > 0) {
        query += `LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`;
    }

    try {
        const [rows] = await connection.query(query, queryParams);
        const [countResult] = await connection.query(countQuery, queryParams);

        const totalCount = countResult[0].totalCount;

        connection.release();
        return { rows, totalCount };
    } catch (err) {
        connection.end();
        throw new Error(`Error executing query: ${err.message}`);
    }
}

function buildQueryWithFilters(filters, query, countQuery, joinFiltersBy = "AND") {
    const queryParams = [];

    if (filters && Array.isArray(filters) && filters.length > 0) {
        const filterConditions = filters.map((filter) => {
            if (!filter.key || !filter.sign) {
                throw new Error("Invalid filter object: Missing 'key' or 'sign'.");
            }

            // Handle cases where filter value is an array (e.g., IN clause)
            if (Array.isArray(filter.value)) {
                const placeholders = filter.value.map(() => "?").join(", ");
                queryParams.push(...filter.value);
                return `${filter.key} ${filter.sign} (${placeholders})`;
            }

            // Handle NULL and NOT NULL cases
            if (
                filter.sign === "IS" &&
                (filter.value === null || filter.value.toUpperCase() === "NULL" || filter.value.toUpperCase() === "NOT NULL")
            ) {
                return `${filter.key} ${filter.sign} ${filter.value || "NULL"}`;
            }

            // Handle standard cases with single values
            if (filter.value !== undefined && filter.value !== null) {
                queryParams.push(filter.value);
                return `${filter.key} ${filter.sign} ?`;
            }

            throw new Error("Invalid filter object: Missing or unsupported 'value'.");
        });

        const combinedConditions = filterConditions.join(` ${joinFiltersBy} `);

        // Append conditions to query and countQuery
        query += `WHERE ${combinedConditions} `;
        countQuery += `WHERE ${combinedConditions} `;
    }

    return { queryParams, query, countQuery };
}

async function create(table, data, cityId) {
    const connection = await getConnection(cityId);
    const query = `INSERT INTO ${table} SET ?`;
    const response = await connection.query(query, data);
    connection.release();
    return { id: response[0].insertId };
}

async function update(table, data, filters, cityId, joinFiltersBy = "AND") {
    const connection = await getConnection(cityId);
    const conditionAndValues = [];
    let setString = "";

    for (const key in data) {
        if (data[key] === undefined) continue;
        setString += `${key} = ?, `;
        conditionAndValues.push(data[key]);
    }

    setString = setString.slice(0, -2);

    let query = `UPDATE ${table} SET ${setString} `;
    const countQuery = ""; // Not needed for update, but required by buildQueryWithFilters
    let queryParams;
    ({ queryParams, query } = buildQueryWithFilters(filters, query, countQuery, joinFiltersBy));

    const response = await connection.query(query, [...conditionAndValues, ...queryParams]);
    connection.release();

    return response;
}

async function deleteData(table, cityId, filters, joinFiltersBy = "AND") {
    try {
        const connection = await getConnection(cityId);
        let query = `DELETE FROM ${table} `;
        const countQuery = "";
        let queryParams;
        ({ queryParams, query } = buildQueryWithFilters(filters, query, countQuery, joinFiltersBy));

        const response = await connection.query(query, queryParams);
        connection.release();
        return response;
    } catch (err) {
        console.error("Error deleting from table", err);
        throw new Error(`Error executing delete query: ${err.message}`);
    }
}

async function callStoredProcedure(spName, parameters, cityId) {
    const connection = await getConnection(cityId);
    let query = `CALL ${spName}`;
    if (parameters && parameters.length > 0) {
        query += `(${Array(parameters.length).fill("?")})`;
    }
    await connection.query(query, parameters);
    connection.release();
}

async function callQuery(query, params, cityId) {
    const connection = await getConnection(cityId);
    const [rows, fields] = await connection.query(query, params);
    connection.release();
    return { rows, fields };
}

async function createTransaction(cityId) {
    const connection = await getConnection(cityId);
    await connection.beginTransaction();
    return connection;
}

async function commitTransaction(connection) {
    await connection.commit();
    connection.release();
}

async function rollbackTransaction(connection) {
    await connection.rollback();
    connection.release();
}

async function createWithTransaction(table, data, connection) {
    const query = `INSERT INTO ${table} SET ?`;
    const response = await connection.query(query, data);
    return { id: response[0].insertId };
}

async function updateWithTransaction(table, data, filters, connection, joinFiltersBy = "AND") {
    const conditionAndValues = [];
    let setString = "";

    for (const key in data) {
        if (data[key] === undefined) continue;
        setString += `${key} = ?, `;
        conditionAndValues.push(data[key]);
    }

    setString = setString.slice(0, -2);

    let query = `UPDATE ${table} SET ${setString} `;
    let queryParams;
    const countQuery = ""; // Not needed for update, but required by buildQueryWithFilters
    ({ queryParams, query } = buildQueryWithFilters(filters, query, countQuery, joinFiltersBy));

    await connection.query(query, [...conditionAndValues, ...queryParams]);
}

async function deleteDataWithTransaction(table, filters, connection, joinFiltersBy = "AND") {
    let query = `DELETE FROM ${table} `;
    const countQuery = "";
    let queryParams;
    ({ queryParams, query } = buildQueryWithFilters(filters, query, countQuery, joinFiltersBy));

    await connection.query(query, queryParams);
}

module.exports = {
    get,
    create,
    update,
    deleteData,
    callStoredProcedure,
    callQuery,
    createTransaction,
    commitTransaction,
    rollbackTransaction,
    createWithTransaction,
    updateWithTransaction,
    deleteDataWithTransaction,
};
