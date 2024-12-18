const mysql = require("mysql2/promise");
require("dotenv").config();

async function getConnection() {
    const pool = mysql.createPool({
        connectionLimit: process.env.DATABASE_POOL_MAX || 10, // default 10
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        port: process.env.DATABASE_PORT || 3306,
    });
    const connection = await pool.getConnection();
    return connection;
}

module.exports = { getConnection };
