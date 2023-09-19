const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname,'..', 'test.db'); 

async function getConnection(cityId) {
    const db = new sqlite3.Database(dbPath);

    if (cityId) {
        // If cityId is provided, query the cities table to get the connection string
        const query = `SELECT * FROM cities WHERE id = ${cityId}`;
        const rows = await query;
        if (rows.length > 0) {
            const connectionString = rows[0].connectionString;
            return new sqlite3.Database(connectionString);
        }
    }

    return db;
}
module.exports=getConnection;