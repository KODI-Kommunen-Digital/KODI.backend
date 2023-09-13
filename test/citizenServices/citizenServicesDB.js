const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createCitizenServicesMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS CITIZEN_SERVICES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cityId INTEGER,
        title TEXT,
        image TEXT,
        link TEXT

    );`);

    await db.exec(`
    INSERT INTO CITIZEN_SERVICES (id, cityId, title, image, link) VALUES (1, 1, 'Forums', '', 'AllForums');

    `);

    return db;
}

module.exports = createCitizenServicesMockDatabase;

