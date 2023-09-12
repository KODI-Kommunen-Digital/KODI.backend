const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createVillageMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS village (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
    );`);

    await db.exec(`
    INSERT INTO village (id, name) VALUES (1, 'testVillage');
    `);

    return db;
}

module.exports = createVillageMockDatabase;

