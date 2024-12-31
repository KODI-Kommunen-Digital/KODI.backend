const AppError = require("../utils/appError");
const status = require("../constants/status");
const categories = require("../constants/categories");
const subcategories = require("../constants/subcategories");
const source = require("../constants/source");
const roles = require("../constants/roles");
const getDateInFormate = require("../utils/getDateInFormate");
const TurndownService = require("turndown");
const showdown = require("showdown");
const defaultImageCount = require("../constants/defaultImagesInBucketCount");
const DEFAULTIMAGE = "Defaultimage";
const sendPushNotification = require("../services/sendPushNotification");
const citiesRepository = require("../repository/citiesRepo");
const userRepository = require("../repository/userRepo");
const cityListingMappingRepo = require("../repository/cityListingMappingRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const statusRepository = require("../repository/statusRepo");
const subcategoriesRepository = require("../repository/subcategoriesRepo");
const listingsRepository = require("../repository/listingsRepo");
const listingsImageRepository = require("../repository/listingsImagesRepo");
const pollOptionsRepository = require("../repository/pollOptionsRepo");

async function createListing(cityIds, payload, userId, roleId) {
    const insertionData = {};
    let user = {};
    let cities = [];
    const hasDefaultImage =
        (payload.logo !== undefined && payload.logo !== null) ||
            payload.hasAttachment
            ? false
            : true;

    if (!payload) {
        throw new AppError(`Empty payload sent`, 400);
    }

    if (!cityIds) {
        throw new AppError(`City is not present`, 404);
    } else if (!Array.isArray(cityIds)) {
        throw new AppError("CityIds should be an array", 400);
    } else {
        // Validate each cityId
        cityIds.forEach((cityId) => {
            if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
                throw new AppError(`Invalid City '${cityId}' given`, 400);
            }
        });

        try {
            const response = await citiesRepository.getAll({
                filters: [
                    {
                        key: "id",
                        sign: "IN",
                        value: cityIds,
                    },
                ],
            });
            if (response.rows && response.rows.length === 0 && response.rows.length !== cityIds.length) {
                const invalidCityIds = cityIds.filter((cityId) => {
                    return !response.rows.some((city) => city.id === cityId);
                });
                throw new AppError(`Invalid City '${invalidCityIds[0]}' given`, 400);
            }
            cities = response.rows
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
        }
    }

    try {
        user = await userRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ]
        });
        if (!user) {
            throw new AppError(`Invalid User '${userId}' given`, 400);
        }
    } catch (err) {
        throw err instanceof AppError ? err : new AppError(err);
    }

    if (!payload.title?.trim()) {
        throw new AppError(`Title is not present`, 400);
    } else if (payload.title.length > 255) {
        throw new AppError(`Length of Title cannot exceed 255 characters`, 400);
    } else {
        insertionData.title = payload.title.trim();
    }
    if (payload.place) {
        insertionData.place = payload.place.trim();
    }

    if (!payload.description?.trim()) {
        throw new AppError(`Description is not present`, 400);
    } else if (payload.description.length > 65535) {
        throw new AppError(
            `Length of Description cannot exceed 65535 characters`,
            400,
        );
    } else {
        insertionData.description = checkDesc(payload.description);
    }

    if (payload.media) {
        insertionData.media = payload.media;
    }

    let subcategory = false;
    if (!payload.categoryId) {
        throw new AppError(`Category is not present`, 400);
    } else {
        try {
            const response = await categoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: payload.categoryId,
                    },
                    {
                        key: "isEnabled",
                        sign: "=",
                        value: true,
                    }
                ],
            });

            if (!response) {
                throw new AppError(
                    `Invalid Category '${payload.categoryId}' given`,
                    400,
                );
            }
            if (response.noOfSubcategories > 0) subcategory = true;
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
        }
        insertionData.categoryId = payload.categoryId;
    }

    if (payload.subcategoryId && subcategory) {
        if (!subcategory) {
            throw new AppError(
                `Invalid Sub Category. Category Id = '${payload.categoryId}' doesn't have a subcategory.`,
                400,
            );
        }
        try {
            const subCategoryData = await subcategoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: payload.subcategoryId,
                    },
                ],
            });
            if (!subCategoryData) {
                throw new AppError(
                    `Invalid Sub Category '${payload.subcategoryId}' given`,
                    400,
                );
            }
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
        }
        insertionData.subcategoryId = payload.subcategoryId;
    }

    if (!payload.statusId) {
        insertionData.statusId = status.Pending;
    } else {
        if (roleId !== roles.Admin) {
            insertionData.statusId = status.Pending;
        } else {
            try {
                const statusData = await statusRepository.getOne({
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: payload.statusId,
                        },
                    ],
                });

                if (!statusData) {
                    throw new AppError(`Invalid Status '${payload.statusId}' given`, 400);
                }
            } catch (err) {
                throw err instanceof AppError ? err : new AppError(err);
            }
            insertionData.statusId = payload.statusId;
        }
    }

    insertionData.sourceId = source.UserEntry;

    if (payload.address) {
        insertionData.address = payload.address.trim();
    }

    if (payload.email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!regex.test(payload.email)) {
            throw new AppError(`Invalid email Id given`, 400);
        }
        insertionData.email = payload.email.toLowerCase();
    }

    if (payload.phone) {
        const re = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
        if (!re.test(payload.phone)) {
            throw new AppError(`Invalid Phone number given`, 400);
        }
        insertionData.phone = payload.phone;
    }

    if (payload.website) {
        try {
            const url = new URL(payload.website);
            insertionData.website = url.toString();
        } catch {
            throw new AppError(`Invalid website URL`, 400);
        }
    }

    if (payload.price) {
        const price = parseFloat(payload.price);
        if (isNaN(price) || price < 0) {
            throw new AppError('Price must be a positive number', 400);
        }
        insertionData.price = price;
    }

    if (payload.discountPrice) {
        const discountPrice = parseFloat(payload.discountPrice);
        if (isNaN(discountPrice) || discountPrice < 0) {
            throw new AppError('Discount price must be a positive number', 400);
        }
        insertionData.discountPrice = discountPrice;
    }

    if (payload.logo) {
        insertionData.logo = payload.logo;
    }

    if (payload.longitude) {
        const lon = parseFloat(payload.longitude);
        if (isNaN(lon) || lon < -180 || lon > 180) {
            throw new AppError('Invalid longitude value', 400);
        }
        insertionData.longitude = lon;
    }

    if (payload.latitude) {
        const lat = parseFloat(payload.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new AppError('Invalid latitude value', 400);
        }
        insertionData.latitude = lat;
    }

    if (payload.zipcode) {
        insertionData.zipcode = payload.zipcode;
    }

    insertionData.createdAt = getDateInFormate(new Date());

    try {
        if (parseInt(payload.categoryId) === categories.News && !payload.timeless) {
            if (payload.expiryDate) {
                const expiryDate = new Date(payload.expiryDate);
                if (isNaN(expiryDate.getTime())) {
                    throw new AppError('Invalid expiry date format', 400);
                }
                insertionData.expiryDate = getDateInFormate(expiryDate);
            } else {
                insertionData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(insertionData.createdAt).getTime() +
                        1000 * 60 * 60 * 24 * 14,
                    ),
                );
            }
        }

        if (parseInt(payload.categoryId) === categories.Events) {
            if (payload.startDate) {
                const startDate = new Date(payload.startDate);
                if (isNaN(startDate.getTime())) {
                    throw new AppError('Invalid start date format', 400);
                }
                insertionData.startDate = getDateInFormate(startDate);
            } else {
                throw new AppError(`Start date is not present`, 400);
            }

            if (payload.endDate) {
                const endDate = new Date(payload.endDate);
                if (isNaN(endDate.getTime())) {
                    throw new AppError('Invalid end date format', 400);
                }
                if (endDate < new Date(payload.startDate)) {
                    throw new AppError('End date cannot be before start date', 400);
                }
                insertionData.endDate = getDateInFormate(endDate);
                insertionData.expiryDate = getDateInFormate(
                    new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24),
                );
            } else {
                insertionData.expiryDate = getDateInFormate(
                    new Date(new Date(payload.startDate).getTime() + 1000 * 60 * 60 * 24),
                );
            }
        }
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(`Invalid time format ${error}`, 400);
    }

    const allResponses = [];
    let transaction;

    try {
        transaction = await listingsRepository.createTransaction();
        insertionData.userId = userId;
        const response = await listingsRepository.createWithTransaction({
            data: insertionData,
        }, transaction);

        const listingId = response.id;


        // verify if the listing is a poll and has poll options
        // verify if the poll options are less than or equal to 10
        // verify the poll options is an array
        // verify the poll options is not empty
        // verify if the listing is a poll
        if (parseInt(payload.categoryId) === categories.Polls) {
            if (
                !payload.pollOptions ||
                !Array.isArray(payload.pollOptions) ||
                payload.pollOptions.length === 0
            ) {
                throw new AppError(`Invalid Poll Options`, 400);
            } else if (payload.pollOptions.length > 10) {
                throw new AppError(`Poll options length cannot exceed 10`);
            } else {
                // verify that no two poll options have the same title
                const pollOptions = payload.pollOptions.map((option) => option.title);
                if (new Set(pollOptions).size !== pollOptions.length) {
                    throw new AppError(`Poll Options cannot have the same title`, 400);
                }
                // assert polloption.title is not empty, is a string and is less than 255 characters
                payload.pollOptions.forEach((option) => {
                    if (
                        !option.title ||
                        typeof option.title !== "string" ||
                        option.title.length > 255
                    ) {
                        throw new AppError(`Invalid Poll Option`, 400);
                    }
                });
                for (const option of payload.pollOptions) {
                    await pollOptionsRepository.createWithTransaction({
                        data: {
                            listingId,
                            title: option.title.trim(),
                        }
                    }, transaction);
                }
            }

        }

        if (hasDefaultImage) {
            await addDefaultImage(transaction, listingId, payload.categoryId);
        }
    
        for (const cityId of cityIds) {
            const city = cities[cityId];

            const response = await cityListingMappingRepo.createWithTransaction({
                data: {
                    cityId,
                    listingId
                }
            }, transaction);

            allResponses.push({
                cityId: Number(cityId),
                listingId,
                mappingId: response.id
            });

            if (
                parseInt(insertionData.categoryId) === categories.News &&
                parseInt(insertionData.subcategoryId) === subcategories.newsflash &&
                insertionData.statusId === status.Active &&
                roleId === roles.Admin
            ) {
                await sendPushNotification.sendPushNotificationToAll(
                    "warnings",
                    "Eilmeldung",
                    city.name + " - " + insertionData.title,
                    { cityId: cityId.toString(), id: listingId.toString() },
                );
            }
        }
        await listingsRepository.commitTransaction(transaction);

        return allResponses;
    } catch (err) {
        await listingsRepository.rollbackTransaction(transaction);
        throw err instanceof AppError ? err : new AppError(err);
    }
}

const updateListing = async (listingId, cityIds, listingData, userId, roleId) => {
    let cities = [];
    const updationData = {};
    let user = {};

    if (cityIds) {
        try {
            cities = await getCities(cityIds);
            if (!cities.length) {
                throw new AppError(`Invalid Cities '${cityIds}' given`, 400);
            }
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
        }
    }

    if (!userId) {
        throw new AppError(`userId not present`, 404);
    } else {
        try {
            user = await getUser(userId);
            if (!user) {
                throw new AppError(`Invalid User '${userId}' given`, 400);
            }
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
        }
    }
    let currentListingData = {};
    if (!listingId) {
        throw new AppError('listingId not present', 404);
    } else {
        currentListingData = await listingsRepository.getOne({
            filters: [
                {
                    key: 'id',
                    value: listingId,
                    sign: "="
                }
            ]
        });
        if (!currentListingData) {
            throw new AppError(`Listing with id = ${listingId} does not exist`, 404);
        }
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    let subcategory = false;
    if (listingData.categoryId) {
        try {
            const categoryData = await categoriesRepository.getOne({
                filters: [
                    {
                        key: 'id',
                        value: listingData.categoryId,
                        sign: "="
                    },
                    {
                        key: 'isEnabled',
                        value: true,
                        sign: "="
                    }
                ]
            });

            if (!categoryData) {
                throw new AppError(`Invalid Category '${listingData.categoryId}'`, 400);
            }
            if (categoryData.noOfSubcategories > 0) {
                subcategory = true;
            } else {
                updationData.subcategoryId = null;
                delete listingData.subcategoryId;
            }
            updationData.categoryId = listingData.categoryId;
        } catch (err) {
            throw new AppError(err);
        }
    }

    if (listingData.subcategoryId) {
        if (!subcategory) {
            throw new AppError(
                `Invalid Sub Category. Category Id = '${listingData.categoryId}' doesn't have a subcategory.`,
                400,
            );
        }
        try {
            const subCategoryData = await subcategoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: listingData.subcategoryId,
                    },
                ],
            });
            if (!subCategoryData) {
                throw new AppError(
                    `Invalid Sub Category '${listingData.subcategoryId}' given`,
                    400,
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        updationData.subcategoryId = listingData.subcategoryId;
    }

    try {
        if (
            parseInt(listingData.categoryId) === categories.News &&
            !listingData.timeless
        ) {
            if (listingData.expiryDate) {
                updationData.expiryDate = getDateInFormate(
                    new Date(listingData.expiryDate)
                );
            } else {
                updationData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(updationData.updatedAt).getTime() +
                        1000 * 60 * 60 * 24 * 14
                    )
                );
            }
        } else if (parseInt(listingData.categoryId) === categories.Events) {
            if (listingData.startDate) {
                updationData.startDate = getDateInFormate(
                    new Date(listingData.startDate)
                );
            } else {
                return new AppError(`Start date is not present`, 400);
            }

            if (listingData.endDate) {
                updationData.endDate = getDateInFormate(new Date(listingData.endDate));
                updationData.expiryDate = getDateInFormate(
                    new Date(new Date(listingData.endDate).getTime() + 1000 * 60 * 60 * 24)
                );
            } else {
                updationData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(listingData.startDate).getTime() + 1000 * 60 * 60 * 24
                    )
                );
            }
        } else {
            updationData.expiryDate = null;
        }
    } catch (error) {
        throw new AppError(`Invalid time format ${error}`, 400);
    }

    if (listingData.title && listingData.title.length > 255) {
        throw new AppError(`Title length cannot exceed 255 characters`, 400);
    } else if (listingData.title) {
        updationData.title = listingData.title;
    }

    if (
        listingData.statusId &&
        listingData.statusId !== currentListingData.statusId &&
        roleId === roles.Admin
    ) {
        try {
            const status = await statusRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: listingData.statusId,
                    },
                ]
            });
            if (!status) {
                throw new AppError(`Invalid Status '${listingData.statusId}' given`, 400);
            }
            updationData.statusId = listingData.statusId;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    updationData.updatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    validateAndAssignListingParameters(updationData, listingData);
    let transaction;
    try {
        transaction = await listingsRepository.createTransaction();
        await listingsRepository.updateWithTransaction({
            data: updationData,
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: listingId
                }
            ]
        }, transaction);

        if (cityIds) {
            await updateCityMappings(updationData, listingId, cityIds, transaction, roleId);
        }
        const isPollCategory = listingData.categoryId === categories.Polls;
        if (isPollCategory) {
            validatePollOptions(listingData.pollOptions);
            await managePollOptions(listingData.pollOptions, listingId, transaction);
        } else {
            updationData.subcategoryId = null;
            delete listingData.subcategoryId;
        }

        await listingsRepository.commitTransaction(transaction);
    } catch (err) {
        await listingsRepository.rollbackTransaction(transaction);
        throw err instanceof AppError ? err : new AppError(err);
    }
}

const checkDesc = (desc) => {
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(desc);
    const converter = new showdown.Converter();
    const html = converter.makeHtml(markdown);
    return html;
};

async function addDefaultImage(transaction, listingId, categoryId) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find(
        (key) => categories[key] === +categoryId,
    );
    const countQuery = await listingsImageRepository.getOne({
        filters: [
            {
                key: "logo",
                sign: "LIKE",
                value: `%${categoryName}%`,
            }
        ],
        columns: ["count(id) as LICount"]
    });
    const categoryCount = countQuery.LICount;
    const moduloValue = ((categoryCount % defaultImageCount[categoryName]) || 0) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    return await listingsImageRepository.createWithTransaction({
        data: {
            listingId,
            imageOrder,
            logo: imageName,
        }
    }, transaction);
}

async function getUser(userId) {
    try {
        const user = await userRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: userId,
                },
            ],
        });
        if (!user) {
            throw new AppError(`Invalid User '${userId}' given`, 400);
        }
        return user;
    } catch (err) {
        if (err instanceof AppError) {
            return err;
        }
        throw new AppError(err, 500);
    }
}

async function getCities(cityIds) {
    try {
        const response = await citiesRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "IN",
                    value: cityIds,
                },
            ],
        });
        if (response.rows && (response.rows.length === 0 || response.rows.length !== cityIds.length)) {
            const invalidCityIds = cityIds.filter((cityId) => {
                return !response.rows.some((city) => city.id === cityId);
            });
            throw new AppError(`Invalid City '${invalidCityIds[0]}' given`, 400);
        }
        return response.rows;
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(err, 500);
    }
}

function validatePollOptions(pollOptions) {
    if (!pollOptions || !Array.isArray(pollOptions) || pollOptions.length === 0) {
        throw new AppError(`Invalid Poll Options`, 400);
    }
    if (pollOptions.length > 10) {
        throw new AppError(`Poll Options cannot exceed 10 items`, 400);
    }
    const titles = pollOptions.map(opt => opt.title);
    if (new Set(titles).size !== titles.length) {
        throw new AppError(`Poll Options must have unique titles`, 400);
    }
}

async function managePollOptions(pollOptions, listingId, transaction) {
    let existingOptions;
    try {
        existingOptions = await pollOptionsRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ]
        });
    } catch (err) {
        if (err instanceof AppError) {
            return err;
        }
        throw new AppError(err, 500);
    }

    const existingIds = existingOptions.rows.map(opt => opt.id);
    const incomingIds = pollOptions.map(opt => opt.id).filter(Boolean);

    for (const id of existingIds) {
        if (!incomingIds.includes(id)) {
            await pollOptionsRepository.deleteWithTransaction({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: id
                    }
                ]
            }, transaction);
        }
    }
    try {
        for (const option of pollOptions) {
            if (option.id && existingIds.includes(option.id)) {
                await pollOptionsRepository.updateWithTransaction({
                    data: {
                        title: option.title
                    },
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: option.id
                        }
                    ]
                }, transaction);
            } else {
                await pollOptionsRepository.createWithTransaction({
                    data: {
                        listingId,
                        title: option.title
                    }
                }, transaction);
            }
        }
    } catch (err) {
        if (err instanceof AppError) {
            return err;
        }
        throw new AppError(err, 500);
    }
}

function validateAndAssignListingParameters(updationData, payload, next) {
    if (payload.description && payload.description.length > 65535) {
        throw next(new AppError(`Description length exceeds limit`, 400));
    } else if (payload.description) {
        updationData.description = payload.description;
    }

    if (payload.email) {
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(payload.email)) {
            throw next(new AppError(`Invalid email format`, 400));
        }
        updationData.email = payload.email;
    }

    if (payload.phone) {
        const phoneRegex = /^[+][0-9]{1,3}[-\s./0-9]*$/;
        if (!phoneRegex.test(payload.phone)) {
            throw next(new AppError(`Invalid phone number format`, 400));
        }
        updationData.phone = payload.phone;
    }

    if (payload.logo && payload.removeImage) {
        throw new AppError(
            `Invalid Input, logo and removeImage both fields present`,
            400,
        );
    }

    if (payload.pdf && payload.removePdf) {
        throw new AppError(
            `Invalid Input, pdf and removePdf both fields present`,
            400,
        );
    }

    if (payload.pdf) {
        updationData.pdf = payload.pdf;
    }
    if (payload.removePdf) {
        updationData.pdf = null;
    }


    // Assign other payload fields
    const allowedFields = ["place", "media", "address", "price", "discountPrice", "zipcode", "website", "longitude", "latitude"];
    for (const field of allowedFields) {
        if (payload[field] !== undefined) {
            updationData[field] = payload[field];
        }
    }
}

async function updateCityMappings(updationData, listingId, updatedCityIds, transaction, roleId) {
    if (!Array.isArray(updatedCityIds) || updatedCityIds.length === 0) {
        return;
    }
    try {
        const response = await cityListingMappingRepo.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ],
        });
        const existingCityIds = response.rows.map(row => row.cityId);
        const cityIdsToDelete = existingCityIds.filter(cityId => !updatedCityIds.includes(cityId));
        const cityIdsToAdd = updatedCityIds.filter(cityId => !existingCityIds.includes(cityId));
        for (const cityId of cityIdsToDelete) {
            await cityListingMappingRepo.deleteWithTransaction({
                filters: [
                    {
                        key: "listingId",
                        sign: "=",
                        value: listingId,
                    },
                    {
                        key: "cityId",
                        sign: "=",
                        value: cityId,
                    },
                ],
            }, transaction);
        }

        // Perform add operations
        for (const cityId of cityIdsToAdd) {
            await cityListingMappingRepo.createWithTransaction({
                data: {
                    listingId,
                    cityId,
                }
            }, transaction);

            const cityResponse = await citiesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: cityId
                    }
                ],
                columns: "name",
            });
            const cityName = cityResponse.name;
            if (
                parseInt(updationData.categoryId) === categories.News &&
                parseInt(updationData.subcategoryId) === subcategories.newsflash &&
                updationData.statusId === status.Active &&
                roleId === roles.Admin
            ) {
                await sendPushNotification.sendPushNotificationToAll(
                    "warnings",
                    "Eilmeldung",
                    cityName + " - " + updationData.title,
                    { cityId: cityId.toString(), id: listingId.toString() },
                );
            }
        }
    } catch (err) {
        if (err instanceof AppError) {
            return err;
        }
        throw new AppError(err, 500);
    }
}


module.exports = { createListing, updateListing };
