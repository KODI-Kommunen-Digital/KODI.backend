const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Create an in-memory SQLite database with mock data
async function createMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    // Define your mock database schema and create tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        );
    `);

    // Insert mock data for each table
    await db.exec(`
        INSERT INTO status (
            id, name
        ) VALUES
        (1, 'Active'),
        (2, 'Inactive'),
        (3, 'Pending');
    `);

    return db;
}

module.exports = createMockDatabase;

