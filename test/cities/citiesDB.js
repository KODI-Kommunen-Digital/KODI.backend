const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createCityMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        connectionString TEXT,
        isAdminListings INTEGER,
        image TEXT,
        inCityServer INTEGER,
        hasForum INTEGER
    );`);
    // ******** IMPORTANT_NOTE:makesure to change the password and server **********
    await db.exec(`
        INSERT INTO cities (id, name, connectionString, isAdminListings, image, inCityServer, hasForum)
        VALUES (1, 'Gotham', 'server=localhost.1;user=root;password=devpassword;database=heidi_city_1', NULL, 'admin/City1.png', NULL, 1);
        `);

    await db.exec(`
        INSERT INTO cities (id, name, connectionString, isAdminListings, image, inCityServer, hasForum)
        VALUES (2, 'Atlanta', 'server=localhost;user=root;password=devpassword;database=heidi_city_2', NULL, 'admin/City2.png', NULL, NULL);
        `);

    return db;
}

module.exports = createCityMockDatabase;
