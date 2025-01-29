const AppError = require("../utils/appError");
const usersRepository = require("../repository/userRepo");
const UserPreferenceCategoriesRepo = require("../repository/userPreferenceCategoriesRepo");
const userPreferenceCitiesRepo = require("../repository/userPreferenceCitiesRepo");

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
        } else if (type === 'CATEGORY_PREFERENCE'){
            if (enabled){
                await UserPreferenceCategoriesRepo.insertCategoryPreferenceUnique(userId, id);
            } else {
                await userPreferenceCitiesRepo.delete({
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
