const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Create an in-memory SQLite database with mock data
async function createMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    return db;
}

module.exports = createMockDatabase;
