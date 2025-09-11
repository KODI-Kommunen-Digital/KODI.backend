const BaseRepo = require("./baseRepo");
const tableNames = require("../constants/tableNames");
const database = require("../utils/database");

class CityUserRolesRepo extends BaseRepo {
    constructor() {
        super(tableNames.CITY_USER_ROLES_TABLE);
    }

    async getCityAdmins(pageNo, pageSize, cityId, searchQuery) {
        const params = [cityId];
        const countParams = [cityId];
        const query = `
        SELECT 
            u.id,
            u.firstName,
            u.lastName,
            u.username,
            u.email,
            u.phoneNumber
        FROM ${tableNames.CITY_USER_ROLES_TABLE} cur
        JOIN ${tableNames.USER_TABLE} u ON u.id = cur.userId
        WHERE cur.cityId = ?
        AND cur.isAdmin = 1
        ${searchQuery.length > 0 ? "AND (u.firstName LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phoneNumber LIKE ?)" : ''}
        LIMIT ?, ?`;

        const countQuery = `
        SELECT 
            COUNT(*) as total
        FROM ${tableNames.CITY_USER_ROLES_TABLE} cur
        JOIN ${tableNames.USER_TABLE} u ON u.id = cur.userId
        WHERE cur.cityId = ?
        AND cur.isAdmin = 1
        ${searchQuery.length > 0 ? "AND (u.firstName LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phoneNumber LIKE ?)" : ''}
        `;

        if (searchQuery.length > 0) {
            params.push(...[`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]);
            countParams.push(...[`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]);
        }

        const limit = (pageNo - 1) * pageSize;
        const offset = pageSize;
        params.push(...[limit, offset]);

        const result = await database.callQuery(query, params);
        const countResult = await database.callQuery(countQuery, countParams);

        return {
            data: result.rows,
            count: countResult.rows[0].total
        };
    }
 
    async isUserCityAdmin(userId, cityId) {
        const result = await this.getOne({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId,
                },
                {
                    key: "cityId",
                    sign: "=",
                    value: cityId,
                },
                {
                    key: "isAdmin",
                    sign: "=",
                    value: 1,
                },
            ]
        });
        return !!result;
    }
    
}

module.exports = new CityUserRolesRepo();