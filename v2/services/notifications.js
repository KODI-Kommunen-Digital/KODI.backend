const AppError = require("../utils/appError");
const usersRepository = require("../repository/userRepo");
const UserPreferenceCategoriesRepo = require("../repository/userPreferenceCategoriesRepo");
const userPreferenceCitiesRepo = require("../repository/userPreferenceCitiesRepo");
const cityRepository = require("../repository/citiesRepo");
const categoryRepository = require("../repository/categoriesRepo");

const updateAllNotifications = async function(userId, enabled){
    try {
        await usersRepository.update({
            data: { allNotificationsEnabled: enabled},
            filters:[
                {
                    key: "id",
                    sign: "=",
                    value: userId
                }
            ]
        });
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
        const resp = await usersRepository.getOne({
            columns: "allNotificationsEnabled",
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId
                }
            ]
        });
        const user = resp;
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
        const respCities = await userPreferenceCitiesRepo.getuserCityPreference(userId);
        const respCategories = await  UserPreferenceCategoriesRepo.getuserCategoryPreference(userId);

        const response = {
            enabled:true,
            preferences: [
                {
                    type: 'CITY_PREFERENCE',
                    name: 'City',
                    preferences: respCities.map(city => ({
                        id: city.id,
                        name: city.name,
                        enabled: !!city.enabled,
                    })),
                },
                {
                    type: 'CATEGORY_PREFERENCE',
                    name: 'Category',
                    preferences: respCategories.map(category => ({
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
            if (id){
                if (enabled){
                    await userPreferenceCitiesRepo.insertCityPreferenceUnique(userId, id);
                } else {
                    await userPreferenceCitiesRepo.delete({
                        filters: [
                            {
                                key: "userId",
                                sign: "=",
                                value: userId
                            },
                            {
                                key: "cityId",
                                sign: "=",
                                value: id
                            }
                        ]
                    });
                }
            } else { // if no id, then delete all city preference of that user
                if (enabled) {
                    const allCities = await cityRepository.getAll(); 
                    const data = allCities.rows.map(city => ({userId, cityId: city.id}));
                    await userPreferenceCitiesRepo.insertMultipleCityPreference(data); // Bulk insert all cities for the user
                } else {
                    await userPreferenceCitiesRepo.delete({
                        filters: [{ key: "userId", sign: "=", value: userId }]
                    });
                }
            }
        } else if (type === 'CATEGORY_PREFERENCE'){
            if(id) {
                if (enabled){
                    await UserPreferenceCategoriesRepo.insertCategoryPreferenceUnique(userId, id);
                } else {
                    await UserPreferenceCategoriesRepo.delete({
                        filters: [
                            {
                                key: "userId",
                                sign: "=",
                                value: userId
                            },
                            {
                                key: "categoryId",
                                sign: "=",
                                value: id
                            }
                        ]
                    });
                }
            } else { // if no id, then delete all category preference of that user
                if (enabled) {
                    const allCategories = await categoryRepository.getAll(); 
                    const insertData = allCategories.rows.map(category => ({userId, categoryId:category.id}));
                    await UserPreferenceCategoriesRepo.insertMultipleCategoryPreference(insertData); // Bulk insert all categories for the user
                } else {
                    await UserPreferenceCategoriesRepo.delete({
                        filters: [{ key: "userId", sign: "=", value: userId }]
                    });
                }
            }
        } else {
            throw new AppError('Invalid preference type', 400);
        }
        return { message: 'Preferences updated successfully'};
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);    
    }
}

module.exports = { updateAllNotifications, getUserNotificationPreference , updateUserNotificationPreference };
