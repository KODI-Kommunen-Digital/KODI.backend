const mysql = require("mysql2/promise");
const tables = require("../constants/tableNames");

// In all these functions, if cityId is given, we connect to that city's database. Else, we connect to the core database
async function get(table, filter, columns, cityId, pageNo, pageSize, orderBy, descending) {
    const connection = await getConnection(cityId);
    connection.connect();
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
    const [rows, fields] = await connection.execute(query, queryParams);
    connection.end();
    return { rows, fields };
}

async function create(table, data, cityId) {
    const connection = await getConnection(cityId);
    connection.connect();
    const query = `INSERT INTO ${table} SET ?`;
    const response = await connection.query(query, data);
    connection.end();
    return { id: response[0].insertId };
}

async function update(table, data, conditions, cityId) {
    const connection = await getConnection(cityId);
    connection.connect();
    const query = `UPDATE ${table} SET ? WHERE ?`;
    await connection.query(query, [data, conditions]);
    connection.end();
}

async function deleteData(table, filter, cityId) {
    const connection = await getConnection(cityId);
    connection.connect();
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
    await connection.execute(query, queryParams);
    connection.end();
}

async function callStoredProcedure(spName, parameters, cityId) {
    const connection = await getConnection(cityId);
    connection.connect();
    let query = `CALL ${spName}`;
    if (parameters && parameters.length > 0) {
        query += `(${Array(parameters.length).fill("?")})`;
    }
    await connection.query(query, parameters);
    connection.end();
}

async function callQuery(query, params, cityId) {
    const connection = await getConnection(cityId);
    connection.connect();
    const [rows, fields] = await connection.execute(query, params);
    connection.end();
    return { rows, fields };
}

async function getConnection(cityId) {
    const coreConnection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });
    if (!cityId) return coreConnection;
    const response = await get(tables.CITIES_TABLE, { id: cityId });
    const cityConnectionString = response.rows[0].connectionString;
    const cityConnectionConfig = {};
    cityConnectionString.split(";").forEach((element) => {
        const elementList = element.split("=");
        cityConnectionConfig[elementList[0]] = elementList[1];
    });
    cityConnectionConfig.host = cityConnectionConfig.server;
    delete cityConnectionConfig.server;
    coreConnection.end();
    const cityConnection = await mysql.createConnection(cityConnectionConfig);
    return cityConnection;
}

module.exports = {
    get,
    create,
    update,
    deleteData,
    callStoredProcedure,
    callQuery,
    getConnection
};
