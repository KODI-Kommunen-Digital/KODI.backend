const AppError = require("../utils/appError");
const usersRepository = require("../repository/userRepo");
const database = require("../utils/database");

const updateAllNotifications = async function(userId, enabled){
    try {
        if (!enabled){
            await database.callQuery('UPDATE users SET allNotificationsEnabled = false WHERE id = ?',
                [userId]);
        } else {
            await database.callQuery('UPDATE users SET allNotificationsEnabled = true WHERE id = ?',
                [userId]);
        }
        return { message: 'Notifications status updated successfully'};
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const getUserNotificationPreference = async function(userId){
    try {
        const userData = await usersRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId
                }
            ]
        });
        if (!userData) {
            throw new AppError(`User with id ${userId} does not exist`, 404);
        }

        const resp = await database.callQuery('SELECT allNotificationsEnabled FROM users WHERE id = ?', [userId]);
        const user = resp.rows[0];
        const allNotificationsEnabled = user.allNotificationsEnabled;
        if (!allNotificationsEnabled){
            return {
                enabled:false,
                preferences: [
                    {
                        type: 'CITY_PREFERENCE',
                        name: 'City',
                        preferences: [],
                    },
                    {
                        type: 'CATEGORY_PREFERENCE',
                        name: 'Category',
                        preferences: [],
                    },        
                ],
            };
        }
        const respCities = await database.callQuery(
            `SELECT c.id, c.name, IF(uc.userId IS NULL, false, true) AS enabled
                FROM cities c
                LEFT JOIN user_preference_cities uc ON c.id = uc.cityId AND uc.userId = ?`,
            [userId]
        );
        const respCategories = await database.callQuery(`
            SELECT ct.id, ct.name, IF(uc.userId IS NULL, false, true) AS enabled
            FROM categories ct
            LEFT JOIN user_preference_categories uc ON ct.id = uc.categoryId AND uc.userId = ?`, 
        [userId]
        ); 

        const response = {
            enabled:true,
            preferences: [
                {
                    type: 'CITY_PREFERENCE',
                    name: 'City',
                    preferences: respCities.rows.map(city => ({
                        id: city.id,
                        name: city.name,
                        enabled: !!city.enabled,
                    })),
                },
                {
                    type: 'CATEGORY_PREFERENCE',
                    name: 'Category',
                    preferences: respCategories.rows.map(category => ({
                        id: category.id,
                        name: category.name,
                        enabled: !!category.enabled,
                    })),
                },
            ],
        };
        return response;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const updateUserNotificationPreference = async function(userId, {type, id, enabled}){
    try {
        if(type === 'CITY_PREFERENCE'){
            if (enabled){
                await database.callQuery('INSERT INTO user_preference_cities (userId, cityId) VALUES (?, ?) ON DUPLICATE KEY UPDATE cityId = cityId',
                    [userId, id]);
            } else {
                await database.callQuery('DELETE FROM user_preference_cities WHERE userId = ? AND cityId = ?', [userId, id]);
            }
        } else if (type === 'CATEGORY_PREFERENCE'){
            if (enabled){
                await database.callQuery('INSERT INTO user_preference_categories (userId, categoryId) VALUES (?, ?) ON DUPLICATE KEY UPDATE categoryId = categoryId',
                    [userId, id]);
            } else {
                await database.callQuery('DELETE FROM user_preference_categories WHERE userId = ? AND categoryId = ?', [userId, id]);
            }
        } else {
            throw new AppError('Invalid preference type', 400);
        }
        return { message: 'Preferences updated successfully'};
    } catch (err) {
        console.error("error updating preference", err.message);
        if (err instanceof AppError) throw err;
        throw new AppError(err);    
    }
}


module.exports = { updateAllNotifications, getUserNotificationPreference , updateUserNotificationPreference };
