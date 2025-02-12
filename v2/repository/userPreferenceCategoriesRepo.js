const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class UserPreferenceCategoriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.USER_PREFERENCE_CATEGORIES_TABLE);
    }

    getuserCategoryPreference = async (userId) => {
        const respCategories = await database.callQuery(
            `SELECT ct.id, ct.name, IF(uc.userId IS NULL, false, true) AS enabled FROM categories ct
            LEFT JOIN user_preference_categories uc ON ct.id = uc.categoryId AND uc.userId = ?`,
            [userId]
        );
        return respCategories.rows;
    }

    insertCategoryPreferenceUnique = async (userId, categoryId) => {
        const response = await database.callQuery('INSERT INTO user_preference_categories (userId, categoryId) VALUES (?, ?) ON DUPLICATE KEY UPDATE categoryId = categoryId',
            [userId, categoryId]
        );
        return response.rows;
    }

    insertMultipleCategoryPreference = async (data) => {
        const columns = Object.keys(data[0]);
        const placeholders = data.map(() => "(?, ?)").join(", ");
        const values = data.flatMap(obj => columns.map(col => obj[col]));
        const query = `INSERT INTO user_preference_categories (${columns.join(", ")}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE categoryId=categoryId`;
        const response = await database.callQuery(query, values);
        return response.rows;
    }
    
}

module.exports = new UserPreferenceCategoriesRepo();