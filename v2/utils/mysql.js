const mysql = require("mysql2/promise");
require("dotenv").config();

function getCorePool() {
    return mysql.createPool({
        connectionLimit: process.env.DATABASE_POOL_MAX || 10, // default 10
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        port: process.env.DATABASE_PORT || 3306,
        timezone: "local",
        typeCast: function (field, next) {
            if (field.type === "DATETIME" || field.type === "TIMESTAMP") {
                return field.string();
            }
            return next();
        },
    });
}
const pool = { 0: getCorePool() };
setInterval(() => {
    const corePool = pool[0].pool;
    if (corePool && corePool._allConnections) {
        console.log(`[MySQL] Total: ${corePool._allConnections.length}, Free: ${corePool._freeConnections.length}, Queue:${corePool._connectionQueue.length}`);
    }
}, 5000)

async function getConnection(cityId) {
    if (!pool[0]) {
        pool[0] = getCorePool();
    }
    const coreConnection = await pool[0].getConnection();
    if (!cityId) {
        return coreConnection;
    }
    if (pool[cityId]) {
        const connection = await pool[cityId].getConnection();
        return connection;
    }
    const [rows] = await coreConnection.query(
        `SELECT * FROM cities WHERE id = ?;`,
        [cityId]
    );
    coreConnection.release();
    const cityConnectionString = rows[0].connectionString;
    const cityConnectionConfig = {};
    cityConnectionString.split(";").forEach((element) => {
        const elementList = element.split("=");
        cityConnectionConfig[elementList[0]] = elementList[1];
    });
    cityConnectionConfig.host = cityConnectionConfig.server;
    cityConnectionConfig.connectionLimit = process.env.DATABASE_POOL_MAX || 10;
    delete cityConnectionConfig.server;
    const cityConnection = mysql.createPool(cityConnectionConfig);
    pool[cityId] = cityConnection;
    const connection = cityConnection.getConnection();
    return connection;
}

module.exports = { getConnection };
