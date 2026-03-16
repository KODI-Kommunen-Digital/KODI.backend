const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class CategoriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CATEGORIES_TABLE);
    }

    getCategoryListingCount = async (cityIds) => {
        let query = `SELECT categoryId, COUNT(categoryId) AS totalCount FROM  (`;
        let innerQuery = ``;
        cityIds.forEach((cityId) => {
            innerQuery += `SELECT categoryId FROM heidi_city_${cityId}.listings WHERE statusId = 1 UNION ALL `;
        });
        innerQuery = innerQuery.slice(0, -11);
        query += innerQuery + `) AS combinedResults GROUP BY categoryId;`;

        const response = await database.callQuery(query);
        if (!response || !response.rows || response.rows.length === 0) {
            return [];
        }
        return response.rows;
    };
}

module.exports = new CategoriesRepo();
