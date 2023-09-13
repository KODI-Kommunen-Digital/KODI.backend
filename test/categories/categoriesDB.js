const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createCategoriesMockDatabase() {
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database,
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        noOfSubcategories INTEGER

    );`);
    await db.exec(`CREATE TABLE IF NOT EXISTS subcategory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        categoryId INTEGER
    );`)

    await db.exec(`
    INSERT INTO categories (
        id, name, noOfSubcategories
    ) VALUES
    (1, 'News', 8),
    (3, 'Events', 0),
    (4, 'Clubs', 0),
    (5, 'Regional Products', 0),
    (6, 'Offer / Search', 0),
    (7, 'New citizen info', 0),
    (9, 'Lost and Found', 0),
    (10, 'Company portraits', 0),
    (11, 'Carpooling / Public transport', 0),
    (12, 'Offers', 0),
    (13, 'Eat or Drink', 0);

    `);
    await db.exec(`       
    INSERT INTO subcategory (
        id, name, categoryId
    ) VALUES
    (1, 'FlashNews', 1),
    (3, 'Politics', 1),
    (4, 'Economy', 1),
    (5, 'Sport', 1),
    (7, 'Local', 1),
    (8, 'Club News', 1),
    (9, 'Road works / Traffic', 1),
    (10, 'Official notification', 1);
    `);
    return db;
}

module.exports = createCategoriesMockDatabase;

