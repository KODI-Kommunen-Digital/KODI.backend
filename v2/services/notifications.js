const AppError = require("../utils/appError");
const usersRepository = require("../repository/userRepo");
const UserPreferenceCategoriesRepo = require("../repository/userPreferenceCategoriesRepo");
const database = require("../utils/database");
const userPreferenceCitiesRepo = require("../repository/userPreferenceCitiesRepo");


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
        const [cities] = await database.callQuery(
            `SELECT c.id, c.name, IF(uc.userId IS NULL, false, true) AS enabled
                FROM cities c
                LEFT JOIN user_preference_cities uc ON c.id = uc.cityId AND uc.userId = ?`,
            [userId]
        );
        const [categories] = await database.callQuery(`
            SELECT ct.id, ct.name, IF(uc.userId IS NULL, false, true) AS enabled
            FROM categories ct
            LEFT JOIN user_preference_categories uc ON ct.id = uc.categoryId AND uc.userId = ?`, 
        [userId]
        ); 

        const response = {
            preferences: [
                {
                    type: 'CITY_PREFERENCE',
                    name: 'City',
                    preferences: cities.map(city => ({
                        id: city.id,
                        name: city.name,
                        enabled: !!city.enabled,
                    })),
                },
                {
                    type: 'CATEGORY_PREFERENCE',
                    name: 'Category',
                    preferences: categories.map(category => ({
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

const updateUserNotificationPreference = async function(userId, preferences){
    const cityTransaction = await  userPreferenceCitiesRepo.createTransaction();
    const categoryTransaction = await UserPreferenceCategoriesRepo.createTransaction();
    try {
        await userPreferenceCitiesRepo.deleteWithTransaction({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId
                }
            ], cityTransaction
        });
        await UserPreferenceCategoriesRepo.deleteWithTransaction({
            filters: [
                {
                    key: "userId",
                    sign: "=",
                    value: userId
                }
            ], categoryTransaction
        });

        for (const city of preferences.find(p => p.type === 'CITY_PREFERENCE').preferences) {
            if (city.enabled) {
                await userPreferenceCitiesRepo.createWithTransaction({
                    data: {
                        userId,
                        cityId: city.id
                    },
                }, cityTransaction);
            }
        }
        for (const category of preferences.find(p => p.type === 'CATEGORY_PREFERENCE').preferences) {
            if (category.enabled) {
                await UserPreferenceCategoriesRepo.createWithTransaction({
                    data: {
                        userId,
                        categoryId: category.id
                    },
                }, categoryTransaction);
            }
        }
        await userPreferenceCitiesRepo.commitTransaction(cityTransaction);
        await UserPreferenceCategoriesRepo.commitTransaction(categoryTransaction);
        return { message: 'Preferences updated successfully'};

    } catch (err) {
        await userPreferenceCitiesRepo.rollbackTransaction(cityTransaction);
        await UserPreferenceCategoriesRepo.rollbackTransaction(categoryTransaction);
        if (err instanceof AppError) throw err;
        throw new AppError(err);    
    }
}


module.exports = { getUserNotificationPreference , updateUserNotificationPreference };
