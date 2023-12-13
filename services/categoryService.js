const database = require("../services/database");
const tables = require("../constants/tableNames");

const getCategories = async () => {
    const response = await database.get(tables.CATEGORIES_TABLE);
    if (response && response.rows && response.rows.length === 0) {
        return [];
    }
    return response.rows;
}

module.exports = {  
    getCategories,
}