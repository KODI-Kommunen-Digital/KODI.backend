const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class CategoriesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CATEGORIES_TABLE);
    }

    getCategoryListingCount = async (cityIds) => {

        // SQL query that dynamically includes or excludes the city filter based on whether cityIds are provided
        const query = `
            SELECT categoryId, COUNT(categoryId) AS totalCount
            FROM listings
            LEFT JOIN city_listing_mappings ON listings.id = city_listing_mappings.listingId
            WHERE listings.statusId = 1
            AND (${cityIds.length > 0 ? `city_listing_mappings.cityId IN (${cityIds.join(', ')})` : 'TRUE'})
            GROUP BY categoryId;
        `;
        const response = await database.callQuery(query);
        if (!response || !response.rows || response.rows.length === 0) {
            return [];
        }
        return response.rows;
    };
}

module.exports = new CategoriesRepo();
