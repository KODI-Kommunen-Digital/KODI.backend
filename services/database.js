const { getConnection } = require("./mysql");

// In all these functions, if cityId is given, we connect to that city's database. Else, we connect to the core database
async function get(table, filter, columns, cityId, pageNo, pageSize, orderBy, descending) {
    const connection = await getConnection(cityId);
    let query = `SELECT ${columns ? columns : "*"} FROM ${table} `;
    const queryParams = [];
    if (filter && Object.keys(filter).length > 0) {
        query += "WHERE ";
        for (const key in filter) {
            if (Array.isArray(filter[key])) {
                query += `${key} IN (${filter[key].map(() => "?").join(",")}) AND `;
                queryParams.push(...filter[key]);
            } else {
                query += `${key} = ? AND `;
                queryParams.push(filter[key]);
            }
        }
        query = query.slice(0, -4);
    }
    if (orderBy) {
        query += `order by ${orderBy.join(', ')} `
        if (descending) {
            query += `desc `
        }
    }

    if (pageNo && pageSize) {
        query += ` LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`;
    }
    const {rows, fields} = await connection.query(query, queryParams);
    connection.release();
    return { rows, fields };
}

async function create(table, data, cityId) {
    const connection = await getConnection(cityId);
    const query = `INSERT INTO ${table} SET ?`;
    const response = await connection.query(query, data);
    connection.release();
    return { id: response[0].insertId };
}

async function update(table, data, conditions, cityId) {
    const connection = await getConnection(cityId);
    const query = `UPDATE ${table} SET ? WHERE ?`;
    await connection.query(query, [data, conditions]);
    connection.release();
}

async function deleteData(table, filter, cityId) {
    const connection = await getConnection(cityId);
    let query = `DELETE FROM ${table} `;
    const queryParams = [];
    if (filter) {
        query += "WHERE ";
        for (const key in filter) {
            query += `${key} = ? AND `;
            queryParams.push(filter[key]);
        }
        query = query.slice(0, -4);
    }
    await connection.query(query, queryParams);
    connection.release();
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

module.exports = {
    get,
    create,
    update,
    deleteData,
    callStoredProcedure,
    callQuery
};
