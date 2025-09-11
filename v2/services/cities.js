const AppError = require("../utils/appError");
const cityServiceRepository = require("../repository/citiesRepo");
const roles = require("../constants/roles");
const imageUpload = require("../utils/imageUpload");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const cityUserRolesRepo = require("../repository/cityUserRolesRepo");
const userRepository = require("../repository/userRepo");

const getCities = async function (hasForum) {
    try {
        const filters = []
        if (hasForum) {
            filters.push(
                {
                    key: 'hasForum',
                    sign: '=',
                    value: hasForum
                })
        }
        // return await cityService.getCities(filter);
        const cities = await cityServiceRepository.getAll({
            filters,
            columns: 'id, name, image, hasForum',
            orderBy: ["sort_order"]
        });
        return cities.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const citiesListingsByUserId = async function (
    userId,
    isSuperAdmin,
    pageNo,
    pageSize,
    searchQuery,
    orderBy,
    isDescending
) {
    try {
        const filters = [];
        if (!isSuperAdmin && userId) {
            const cityUserRoles = await cityUserRolesRepo.getAll({
                filters: [
                    { key: "userId", sign: "=", value: userId },
                    { key: "isAdmin", sign: "=", value: 1 }
                ],
                columns: ["cityId"]
            });
            const cityIds = cityUserRoles.rows.map(row => row.cityId);
            if (cityIds.length === 0) {
                return [];
            }
            filters.push({
                key: "id",
                sign: "IN",
                value: cityIds
            });
        }
        if (searchQuery) {
            filters.push({
                key: "name",
                sign: "LIKE",
                value: `%${searchQuery.trim().replace(/'/g, "''")}%`,
            });
        }
        let effectiveOrderBy = orderBy;
        if (!effectiveOrderBy) {
            effectiveOrderBy = "name";
        }
        const cities = await cityServiceRepository.getAll({
            columns: 'id, name, image, hasForum',
            filters,
            pageNo,
            pageSize,
            orderBy: [effectiveOrderBy],
            isDescending,
        });
        return cities.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getCityById = async function (id) {
    try {
        const filters = []
        if (id) {
            filters.push(
                {
                    key: 'id',
                    sign: '=',
                    value: id
                })
        }
        const cities = await cityServiceRepository.getOne({
            filters,
            columns: 'id, name, image, hasForum',
        });
        return cities;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getCityAdmins = async function (pageNo, pageSize, roleId, cityId, searchQuery) {

    if (roleId !== roles.Admin) {
        throw new AppError(`You are not authorized to perform this action`, 403);
    }
    if (isNaN(cityId)) {
        throw new AppError(`City Id must be a number`, 400);
    }
    if (isNaN(pageNo)) {
        throw new AppError(`Page number must be a number`, 400);
    }
    if (isNaN(pageSize)) {
        throw new AppError(`Page size must be a number`, 400);
    }

    if (cityId) {
        const city = await cityServiceRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: cityId
                }
            ],
            columns: "id"
        });
        if (!city) {
            throw new AppError(`City not found`, 404);
        }
    }

    return cityUserRolesRepo.getCityAdmins(pageNo, pageSize, cityId, searchQuery);
};

const createCityAdmin = async function (roleId, cityId, userId) {

    if (roleId !== roles.Admin) {
        throw new AppError(`You are not authorized to perform this action`, 403);
    }
    if (!userId || !cityId || isNaN(Number(userId)) || isNaN(Number(cityId))) {
        throw new AppError("Invalid payload", 400);
    }
    const user = await userRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: userId
            }
        ],
        columns: "id, roleId"
    });
    if (!user) {
        throw new AppError(`User not found`, 404);
    }
    if (user.roleId === roles.Admin) {
        throw new AppError(`User is already a super admin`, 400);
    }

    const city = await cityServiceRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: cityId
            }
        ],
        columns: "id"
    });
    if (!city) {
        throw new AppError(`City not found`, 404);
    }

    const cityAdmin = await cityUserRolesRepo.getOne({
        filters: [
            {
                key: "userId",
                sign: "=",
                value: userId
            },
            {
                key: "cityId",
                sign: "=",
                value: cityId
            },
            {
                key: "isAdmin",
                sign: "=",
                value: 1
            }
        ]
    });
    if (cityAdmin) {
        throw new AppError(`User is already a city admin`, 400);
    }

    await cityUserRolesRepo.create({
        data: {
            userId,
            cityId,
            isAdmin: 1
        }
    });

    // Update user role to city admin
    await userRepository.update({
        data: { roleId: roles["City Admin"] },
        filters: [{ key: "id", sign: "=", value: userId }]
    });
};

const deleteCityAdmin = async function (roleId, cityId, userId) {

    if (roleId !== roles.Admin) {
        throw new AppError(`You are not authorized to perform this action`, 403);
    }
    if (!userId || !cityId || isNaN(Number(userId)) || isNaN(Number(cityId))) {
        throw new AppError("Invalid payload", 400);
    }

    const cityAdmin = await cityUserRolesRepo.getOne({
        filters: [
            {
                key: "userId",
                sign: "=",
                value: userId
            },
            {
                key: "cityId",
                sign: "=",
                value: cityId
            },
            {
                key: "isAdmin",
                sign: "=",
                value: 1
            }
        ]
    });
    if (!cityAdmin) {
        throw new AppError(`User is not a city admin`, 400);
    }

    await cityUserRolesRepo.delete({
        filters: [
            {
                key: "userId",
                sign: "=",
                value: userId
            },
            {
                key: "cityId",
                sign: "=",
                value: cityId
            },
            {
                key: "isAdmin",
                sign: "=",
                value: 1
            }
        ]
    });

    // Check if user is admin for any other city
    const otherCityAdmin = await cityUserRolesRepo.getOne({
        filters: [
            {
                key: "userId",
                sign: "=",
                value: userId
            },
            {
                key: "isAdmin",
                sign: "=",
                value: 1
            }
        ]
    });

    if (!otherCityAdmin) {
        // Update user role to Content Creator
        await userRepository.update({
            data: { roleId: roles["Content Creator"]},
            filters: [{ key: "id", sign: "=", value: userId }]
        });
    }
};

const createCity = async (roleId ,city) => {
    try {
        if(roleId !== roles.Admin){
            throw new AppError("Unauthorized", 401);
        }
        const insertionData = {};
        if (!city.name || typeof city.name !== "string" || city.name.trim() === "") {
            throw new AppError("City name is required and must be a non-empty string.");
        }
        const duplicateCheck = await cityServiceRepository.getAll({
            filters: [{ key: "name", sign: "=", value: city.name.trim() }],
            columns: "id"
        });
        if (duplicateCheck.rows.length > 0) {
            throw new AppError("City name already exists.");
        }
        insertionData.name = city.name.trim();
        insertionData.isAdminListings = 0;
        insertionData.inCityServer = 0;
        insertionData.hasForum = 1;

        const result = await cityServiceRepository.getAll({
            columns: "MAX(sort_order) as max_sort_order"
        });
        const maxSortOrder = result.rows[0]?.max_sort_order || 0;
        insertionData.sort_order = maxSortOrder + 1; // eslint-disable-line camelcase

        return await cityServiceRepository.create({ data: insertionData });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const updateCity = async (roleId, id, city) => {
    try {
        if(roleId !== roles.Admin && roleId !== roles["City Admin"]){
            throw new AppError("Unauthorized", 401);
        }
        if (!city.name || typeof city.name !== "string" || city.name.trim() === "") {
            throw new AppError("City name is required and must be a non-empty string.");
        }

        // Check for duplicate name (excluding current city)
        const duplicateCheck = await cityServiceRepository.getAll({
            filters: [
                { key: "name", sign: "=", value: city.name.trim() },
                { key: "id", sign: "!=", value: id }
            ],
            columns: "id"
        });

        if (duplicateCheck.rows.length > 0) {
            throw new AppError("City name already exists.");
        }
        return await cityServiceRepository.update({ data: city, filters: [{ key: "id", sign: "=", value: id }] });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteCity = async (roleId, id) => {
    try {
        if (roleId !== roles.Admin) {
            throw new AppError("Unauthorized", 401);
        }
        const city = await cityServiceRepository.getAll({
            filters: [{ key: "id", sign: "=", value: id }],
            columns: "id, image"
        });
        if (!city.rows.length) {
            throw new AppError("City not found.", 404);
        }
        // const cityData = city.rows[0];
        // if (cityData.image) {
        //     try {
        //         await imageDeleteAsync.deleteImage(cityData.image);
        //     } catch (deleteErr) {
        //         console.error("Failed to delete city image:", deleteErr);
        //     }
        // }
        return await cityServiceRepository.delete({ filters: [{ key: "id", sign: "=", value: id }] });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const uploadImage = async (cityId, roleId, imageFiles) => {
    try {
        if(roleId !== roles.Admin && roleId !== roles["City Admin"]){
            throw new AppError("Unauthorized", 401);
        }

        if (!imageFiles) {
            throw new AppError("No image file provided", 400);
        }

        const city = await cityServiceRepository.getOne({
            filters: [{ key: "id",sign: "=", value: cityId }],
            columns: "id, image, name"
        });

        if (!city) {
            throw new AppError("City not found", 404);
        }
        const imageArr = imageFiles ? (imageFiles.length > 1 ? imageFiles : [imageFiles]) : [];

        if(imageArr.length === 0){
            throw new AppError("No image file provided", 400);
        }
        if(imageArr.length > 1){
            throw new AppError("Multiple image files provided", 400);
        }
        const hasIncorrectMime = imageArr.some((i) => !i.mimetype.includes("image/"));
        if (hasIncorrectMime) {
            throw new AppError(`Invalid Image type`, 403);
        }
        const filePath = `cities/${cityId}_${Date.now()}`;
        const { uploadStatus, objectKey } = await imageUpload(
            imageArr[0],
            filePath
        );

        if (uploadStatus !== "Success" || !objectKey) {
            throw new AppError("Failed to upload image", 500);
        }

        await cityServiceRepository.update({
            data: { image: objectKey },
            filters: [{ key: "id", sign: "=", value: cityId }]
        });

        // if (city.image) {
        //     try {
        //         await imageDeleteAsync.deleteImage(city.image);
        //     } catch (deleteErr) {
        //         console.error("Failed to delete old image:", deleteErr);
        //     }
        // }

        return { success: true, imagePath: objectKey };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteImage = async (cityId, roleId) => {
    try {
        if (roleId !== roles.Admin && roleId !== roles["City Admin"]) {
            throw new AppError("Unauthorized", 401);
        }

        const city = await cityServiceRepository.getOne({
            filters: [{ key: "id", sign: "=", value: cityId }],
            columns: "id, image"
        });

        if (!city) {
            throw new AppError("City not found", 404);
        }

        if (!city.image) {
            throw new AppError("No image found for this city", 404);
        }

        try {
            await imageDeleteAsync.deleteImage(city.image);
        } catch (deleteErr) {
            console.error("Failed to delete image file:", deleteErr);
            throw new AppError("Failed to delete image file", 500);
        }

        await cityServiceRepository.update({
            data: { image: null },
            filters: [{ key: "id", sign: "=", value: cityId }]
        });

        return { success: true };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getCities,
    createCity,
    updateCity,
    deleteCity,
    uploadImage,
    deleteImage,
    getCityById,
    getCityAdmins,
    createCityAdmin,
    deleteCityAdmin,
    citiesListingsByUserId
};
