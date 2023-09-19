// SQLite is a file-based database that does not require connection pooling as each operation opens a connection to the database and closes it when done.
// Therefore, the concept of creating and managing connection pools is not applicable to SQLite.

const MockDb = require('./mockDb.js');

async function getConnection(cityId) {
    const db = new MockDb(cityId);
    return db;
}

module.exports = { getConnection };