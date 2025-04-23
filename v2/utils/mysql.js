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
        // typeCast: function (field, next) {
        //     if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
        //         const utcDate = field.string();
        //         if (utcDate && !utcDate.includes('T') && !utcDate.includes('Z')) {
        //             const date = new Date(utcDate.replace(' ', 'T') + 'Z');
        //             const berlinTimeOffset = 60; // Berlin is UTC+1, and +2 during daylight saving
        //             const berlinDate = new Date(date.getTime() + berlinTimeOffset * 60 * 1000);
        //             return berlinDate.toISOString().replace('T', ' ').slice(0, 16);
        //         }
        //         return utcDate; // Return as is if it already has timezone info
        //     }
        //     return next();
        // }
    });
}
const pool = { 0: getCorePool() };

async function getConnection(cityId) {
    if (!pool[0]) {
        pool[0] = getCorePool();
    }
    const coreConnection = await pool[0].getConnection()
    if (!cityId) {
        return coreConnection;
    }
    if (pool[cityId]) {
        const connection = await pool[cityId].getConnection();
        return connection;
    }
    const [rows] = await coreConnection.query(
        `SELECT * FROM cities WHERE id = ?;`,
        [cityId],
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
