const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        );
    `);

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

