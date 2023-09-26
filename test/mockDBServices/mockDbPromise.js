// const sqlite3 = require('sqlite3');
// const path = require('path');

// const corePath = path.join(__dirname,'..', 'test.db'); 
// // const cityPath = path.join(__dirname,'..', 'city-1.db');
// async function getConnection(cityId) {
//     const db = new sqlite3.Database(corePath);

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
