
// async function getConnection(cityId) {
//     const db = new sqlite3.Database(dbPath);

//     if (cityId) {
//         // If cityId is provided, query the cities table to get the connection string
//         const rows = await query('SELECT * FROM cities WHERE id = ?', [cityId]);
//         if (rows.length > 0) {
//             const connectionString = rows[0].connectionString;
//             return new sqlite3.Database(connectionString);
//         }
//     }

//     return db;
// }
