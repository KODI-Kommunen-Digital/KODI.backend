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

const updateUserNotificationPreference = async function(userId, { type, ids = [] }) {
    try {
        if (!userId) {
            throw new AppError('User ID is required', 400);
        }
        if (!type) {
            throw new AppError('Preference type is required', 400);
        }
        if (!Array.isArray(ids)) {
            throw new AppError('Preference ids must be an array', 400);
        }

        if (type === 'CITY_PREFERENCE') {
            // Validate city ids
            if (ids.length > 0) {
                const cities = await cityRepository.getAll({
                    filters: [{ key: "id", sign: "IN", value: ids }]
                });
                const foundIds = cities.map(city => city.id);
                const notFound = ids.filter(id => !foundIds.includes(id));
                if (notFound.length > 0) {
                    throw new AppError(`Invalid city ids: ${notFound.join(', ')}`, 400);
                }
            }
            // Remove all existing city preferences for the user
            await userPreferenceCitiesRepo.delete({
                filters: [{ key: "userId", sign: "=", value: userId }]
            });
            // Insert new preferences if ids are provided
            if (ids.length > 0) {
                const data = ids.map(cityId => ({ userId, cityId }));
                await userPreferenceCitiesRepo.insertMultipleCityPreference(data);
            }
        } else if (type === 'CATEGORY_PREFERENCE') {
            // Validate category ids
            if (ids.length > 0) {
                const categories = await categoryRepository.getAll({
                    filters: [{ key: "id", sign: "IN", value: ids }]
                });
                const foundIds = categories.map(category => category.id);
                const notFound = ids.filter(id => !foundIds.includes(id));
                if (notFound.length > 0) {
                    throw new AppError(`Invalid category ids: ${notFound.join(', ')}`, 400);
                }
            }
            // Remove all existing category preferences for the user
            await UserPreferenceCategoriesRepo.delete({
                filters: [{ key: "userId", sign: "=", value: userId }]
            });
            // Insert new preferences if ids are provided
            if (ids.length > 0) {
                const data = ids.map(categoryId => ({ userId, categoryId }));
                await UserPreferenceCategoriesRepo.insertMultipleCategoryPreference(data);
            }
        } else {
            throw new AppError('Invalid preference type', 400);
        }
        return { message: 'Preferences updated successfully' };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = { updateAllNotifications, getUserNotificationPreference , updateUserNotificationPreference };
