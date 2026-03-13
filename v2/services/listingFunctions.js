const AppError = require("../utils/appError");
const status = require("../constants/status");
const categories = require("../constants/categories");
const subcategories = require("../constants/subcategories");
const source = require("../constants/source");
const roles = require("../constants/roles");
const getDateInFormate = require("../utils/getDateInFormate");
const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
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
const cityUserRolesRepository = require("../repository/cityUserRolesRepo");
const moderatorsRepository = require("../repository/moderatorsRepo");
const moderatorPermissionsRepository = require("../repository/moderatorPermissionsRepo");
const userRepo = require("../repository/userRepo");

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
            if (
                response.rows &&
                response.rows.length === 0 &&
                response.rows.length !== cityIds.length
            ) {
                const invalidCityIds = cityIds.filter((cityId) => {
                    return !response.rows.some((city) => city.id === cityId);
                });
                throw new AppError(
                    `Invalid City '${invalidCityIds[0]}' given`,
                    400
                );
            }
            cities = response.rows;
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
            ],
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
            400
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
                    },
                ],
            });

            if (!response) {
                throw new AppError(
                    `Invalid Category '${payload.categoryId}' given`,
                    400
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
                400
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
                    400
                );
            }
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
        }
        insertionData.subcategoryId = payload.subcategoryId;
    }

    // Check permissions based on role
    const cityAdminMap = {};
    await Promise.all(
        cityIds.map(async (cityId) => {
            cityAdminMap[cityId] =
                await cityUserRolesRepository.isUserCityAdmin(userId, cityId);
        })
    );
    const isAnAdmin = Object.keys(cityAdminMap).some(
        (cityId) => cityAdminMap[cityId]
    );

    // If user is a moderator, validate city access and category permissions
    if (roleId === roles.Moderator) {
        // 1. Check city access
        const moderatorCities = await moderatorsRepository.getAll({
            filters: [{ key: "userId", sign: "=", value: userId }],
            columns: ["id", "cityId"],
        });
        const allowedCityIds = new Set(
            moderatorCities.rows.map((r) => r.cityId)
        );
        const unauthorizedCities = cityIds.filter(
            (cid) => !allowedCityIds.has(cid)
        );
        if (unauthorizedCities.length > 0) {
            throw new AppError(
                `Not authorized for cities: ${unauthorizedCities.join(",")}`,
                403
            );
        }

        // 2. Check category permissions
        for (const record of moderatorCities.rows) {
            const perms = await moderatorPermissionsRepository.getAll({
                columns: ["permissionId"],
                filters: [{ key: "moderatorId", sign: "=", value: record.id }],
            });
            const permissionIds = new Set(
                perms.rows.map((p) => p.permissionId)
            );

            // Category validation based on requirements
            if (
                payload.categoryId === categories.News &&
                !permissionIds.has(2)
            ) {
                // create_news permission
                throw new AppError(
                    "Missing create_news permission for News category",
                    403
                );
            }
            if (
                payload.categoryId === categories.Events &&
                !permissionIds.has(1)
            ) {
                // create_events permission
                throw new AppError(
                    "Missing create_events permission for Events category",
                    403
                );
            }
        }
    }

    if (
        payload.statusId &&
        (roleId === roles.Admin || isAnAdmin || roleId === roles.Moderator)
    ) {
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
                throw new AppError(
                    `Invalid Status '${payload.statusId}' given`,
                    400
                );
            }
        } catch (err) {
            throw err instanceof AppError ? err : new AppError(err);
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
        let website = payload.website.trim(); // Remove leading/trailing whitespace

        // Prepend "https://" if protocol is missing
        if (!/^https?:\/\//i.test(website)) {
            website = `https://${website}`;
        }

        try {
            const url = new URL(website);
            // Optional: Restrict to HTTP/HTTPS protocols
            if (!["http:", "https:"].includes(url.protocol)) {
                throw new AppError(
                    "Only HTTP/HTTPS protocols are allowed",
                    400
                );
            }
            insertionData.website = url.toString();
        } catch (err) {
            throw new AppError("Invalid website URL", 400);
        }
    }

    if (payload.price) {
        const price = parseFloat(payload.price);
        if (isNaN(price) || price < 0) {
            throw new AppError("Price must be a positive number", 400);
        }
        insertionData.price = price;
    }

    if (payload.discountPrice) {
        const discountPrice = parseFloat(payload.discountPrice);
        if (isNaN(discountPrice) || discountPrice < 0) {
            throw new AppError("Discount price must be a positive number", 400);
        }
        insertionData.discountPrice = discountPrice;
    }

    if (payload.logo) {
        insertionData.logo = payload.logo;
    }

    if (payload.longitude) {
        const lon = parseFloat(payload.longitude);
        if (isNaN(lon)) {
            throw new AppError(
                "Invalid longitude value, Longitude value should be a Number",
                400
            );
        }
        if (lon < -180 || lon > 180) {
            throw new AppError(
                "Invalid longitude value, Longitude value should be between -180° to 180°",
                400
            );
        }
        insertionData.longitude = lon;
    }

    if (payload.latitude) {
        const lat = parseFloat(payload.latitude);
        if (isNaN(lat)) {
            throw new AppError("Invalid latitude value", 400);
        }
        if (lat < -90 || lat > 90) {
            throw new AppError(
                "Invalid latitude value, Latitude value should be between -90° to 90°",
                400
            );
        }
        insertionData.latitude = lat;
    }

    if (payload.zipcode) {
        insertionData.zipcode = payload.zipcode;
    }

    insertionData.createdAt = getDateInFormate(new Date());

    try {
        if (
            parseInt(payload.categoryId) === categories.News &&
            !payload.timeless
        ) {
            if (payload.expiryDate) {
                const expiryDate = new Date(payload.expiryDate);
                if (isNaN(expiryDate.getTime())) {
                    throw new AppError(
                        'Invalid expiry date format, example format: "2025-01-06T07:47:09.230Z" ',
                        400
                    );
                }
                insertionData.expiryDate = getDateInFormate(expiryDate);
            } else {
                insertionData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(insertionData.createdAt).getTime() +
                            1000 * 60 * 60 * 24 * 14
                    )
                );
            }
        }

        if (parseInt(payload.categoryId) === categories.Events) {
            if (payload.startDate) {
                const startDate = new Date(payload.startDate);
                if (isNaN(startDate.getTime())) {
                    throw new AppError(
                        'Invalid start date format, example format: "2025-01-06T07:47:09.230Z"',
                        400
                    );
                }
                insertionData.startDate = getDateInFormate(startDate);
            } else {
                throw new AppError(`Start date is not present`, 400);
            }

            if (payload.endDate) {
                const endDate = new Date(payload.endDate);
                if (isNaN(endDate.getTime())) {
                    throw new AppError(
                        'Invalid end date format, example format: "2025-01-06T07:47:09.230Z" ',
                        400
                    );
                }
                if (endDate < new Date(payload.startDate)) {
                    throw new AppError(
                        "End date cannot be before start date",
                        400
                    );
                }
                insertionData.endDate = getDateInFormate(endDate);
                insertionData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(payload.endDate).getTime() +
                            1000 * 60 * 60 * 24
                    )
                );
            } else {
                insertionData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(payload.startDate).getTime() +
                            1000 * 60 * 60 * 24
                    )
                );
            }
        }
    } catch (error) {
        throw error instanceof AppError
            ? error
            : new AppError(`Invalid time format ${error}`, 400);
    }

    const allResponses = [];
    let transaction;

    try {
        transaction = await listingsRepository.createTransaction();
        insertionData.userId = userId;
        insertionData.statusId =
            roleId === roles.Admin ||
            cityAdminMap?.[cityIds?.[0]] ||
            roles.Moderator
                ? payload.statusId || status.Active
                : status.Pending;
        const response = await listingsRepository.createWithTransaction(
            {
                data: insertionData,
            },
            transaction
        );

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
                const pollOptions = payload.pollOptions.map(
                    (option) => option.title
                );
                if (new Set(pollOptions).size !== pollOptions.length) {
                    throw new AppError(
                        `Poll Options cannot have the same title`,
                        400
                    );
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
                    await pollOptionsRepository.createWithTransaction(
                        {
                            data: {
                                listingId,
                                title: option.title.trim(),
                            },
                        },
                        transaction
                    );
                }
            }
        }

        if (hasDefaultImage) {
            await addDefaultImage(transaction, listingId, payload.categoryId);
        }

        let cityOrder = 1;
        const cityIdOrderMap = {};
        for (const cityId of cityIds) {
            cityIdOrderMap[cityId] = cityOrder;
            cityOrder += 1;
        }
        for (const city of cities) {
            const cityId = city.id;
            const mappingStatus =
                roleId === roles.Admin ||
                cityAdminMap[city.id] ||
                roleId === roles.Moderator
                    ? payload.statusId || status.Active
                    : status.Pending;

            const cityOrder = cityIdOrderMap[cityId];
            if (!cityOrder) {
                continue;
            }
            const response = await cityListingMappingRepo.createWithTransaction(
                {
                    data: {
                        cityId,
                        listingId,
                        cityOrder,
                        status: mappingStatus,
                    },
                },
                transaction
            );

            allResponses.push({
                cityId: Number(cityId),
                listingId,
                mappingId: response.id,
                status: mappingStatus,
            });

            if (
                parseInt(insertionData.categoryId) === categories.News &&
                parseInt(insertionData.subcategoryId) ===
                    subcategories.newsflash &&
                mappingStatus === status.Active &&
                roleId === roles.Admin &&
                payload.notify === true
            ) {
                setTimeout(async () => {
                    try {
                        await sendPushNotification.sendPushNotificationToAll(
                            "warnings",
                            "Eilmeldung",
                            city.name + " - " + insertionData.title,
                            { cityId: cityId.toString(), id: listingId.toString() }
                        );
                    } catch (pushErr) {
                        console.error(`Failed to send push notification for listing ${listingId}`, pushErr);
                    }
                }, 60000); // 1 minute delay for image upload
            }
        }
        const activeListingsCities = allResponses
            ?.filter((response) => response.status === 1)
            .map((response) => response.cityId);
        // const pendingListingsCities = allResponses
        //     ?.filter((response) => response.status === status.Pending)
        //     .map((response) => response.cityId);

        // if (
        //     (roleId === roles["Content Creator"] ||
        //         roleId === roles["Department Head"]) &&
        //     pendingListingsCities?.length > 0
        // ) {
        //     await sendPushNotification.sendPushNotificationsToAdmin(
        //         cityIds,
        //         insertionData.categoryId,
        //         "Neue Meldung von einem Benutzer, bitte überprüfen Sie die Meldung",
        //         insertionData.title,
        //         {
        //             cities: JSON.stringify(pendingListingsCities),
        //             id: listingId.toString(),
        //         }
        //     );
        // }
        console.log(
            `committing transaction for listing ${listingId} and active listingcities lenght is ${activeListingsCities?.length}`
        );
        await listingsRepository.commitTransaction(transaction);
        if (
            (roleId === roles.Admin ||
                roleId === roles["City Admin"] ||
                roleId === roles.Moderator) &&
            activeListingsCities?.length > 0 &&
            payload.notify === true
        ) {
            setTimeout(async () => {
                try {
                    // get all the normal users (role ID 3 - Content Creator) and return array of ids
                    const normalUserIds = await userRepo.getNormalUserIds();

                    // Build the complete listing data with all related information
                    const listingData = await buildCompleteListingData(listingId);

                    await sendPushNotification.sendPushNotifications(
                        normalUserIds,
                        "Neue Meldung",
                        insertionData.title,
                        {
                            type: "new_listing",
                            data: JSON.stringify(listingData),
                        }
                    );
                    console.log(
                        `sending push notification to user for listing ${listingId} and users ${normalUserIds}`
                    );
                } catch (pushErr) {
                    console.error(`Failed to send push notification for listing ${listingId}`, pushErr);
                }
            }, 60000); // 1 minute delay for image upload
        }
        return allResponses;
    } catch (err) {
        await listingsRepository.rollbackTransaction(transaction);
        throw err instanceof AppError ? err : new AppError(err);
    }
}

const updateListing = async (
    listingId,
    cityIds,
    listingData,
    userId,
    roleId
) => {
    let cities = [];
    const updationData = {};
    let user = {};

    if (cityIds && cityIds.length > 0) {
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
        throw new AppError("listingId not present", 404);
    } else {
        currentListingData = await listingsRepository.getOne({
            filters: [
                {
                    key: "id",
                    value: listingId,
                    sign: "=",
                },
            ],
        });
        if (!currentListingData) {
            throw new AppError(
                `Listing with id = ${listingId} does not exist`,
                404
            );
        }
    }
    const isOwner = currentListingData.userId === userId;
    const currentStatusId = currentListingData.statusId;
    const cityAdminMap = {};
    await Promise.all(
        cityIds.map(async (cityId) => {
            cityAdminMap[cityId] =
                await cityUserRolesRepository.isUserCityAdmin(userId, cityId);
        })
    );
    const isAnCityAdmin = Object.keys(cityAdminMap).some(
        (cityId) => cityAdminMap[cityId]
    );
    const isAdmin = roleId === roles.Admin || isAnCityAdmin;

    if (!isAdmin && !isOwner) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    let subcategory = false;
    if (listingData.categoryId) {
        try {
            const categoryData = await categoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        value: listingData.categoryId,
                        sign: "=",
                    },
                    {
                        key: "isEnabled",
                        value: true,
                        sign: "=",
                    },
                ],
            });

            if (!categoryData) {
                throw new AppError(
                    `Invalid Category '${listingData.categoryId}'`,
                    400
                );
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
                400
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
                    400
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        updationData.subcategoryId = listingData.subcategoryId;
    }

    updationData.updatedAt = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    try {
        if (
            parseInt(listingData.categoryId) === categories.News &&
            !listingData.timeless
        ) {
            if (listingData.expiryDate && listingData.expiryDate.length > 0) {
                updationData.expiryDate = getDateInFormate(
                    new Date(listingData.expiryDate)
                );
            } else if (!currentListingData.expiryDate) {
                updationData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(updationData.updatedAt).getTime() +
                            1000 * 60 * 60 * 24 * 14
                    )
                );
            }
        } else if (parseInt(listingData.categoryId) === categories.Events) {
            if (listingData.startDate && listingData.startDate.length > 0) {
                updationData.startDate = getDateInFormate(
                    new Date(listingData.startDate)
                );
            } else if (!currentListingData.startDate) {
                return new AppError(`Start date is not present`, 400);
            }

            if (listingData.endDate && listingData.endDate.length > 0) {
                updationData.endDate = getDateInFormate(
                    new Date(listingData.endDate)
                );
                updationData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(listingData.endDate).getTime() +
                            1000 * 60 * 60 * 24
                    )
                );
            } else if (!currentListingData.endDate) {
                updationData.expiryDate = getDateInFormate(
                    new Date(
                        new Date(listingData.startDate).getTime() +
                            1000 * 60 * 60 * 24
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

    if (!isAdmin) {
        // Non-admin user restrictions
        if (currentStatusId === status.Approved) {
            throw new AppError(
                `Approved listings cannot be updated by this user`,
                403
            );
        }

        // Override any user-sent status to Pending
        updationData.statusId = status.Pending;
    } else {
        // Admin: handle status change if any
        if (listingData.statusId && listingData.statusId !== currentStatusId) {
            try {
                const statusData = await statusRepository.getOne({
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: listingData.statusId,
                        },
                    ],
                });
                if (!statusData) {
                    throw new AppError(
                        `Invalid Status '${listingData.statusId}' given`,
                        400
                    );
                }
                updationData.statusId =
                    roleId === roles.Admin || cityAdminMap?.[cities?.[0].id]
                        ? listingData.statusId
                        : currentStatusId;
            } catch (err) {
                throw err instanceof AppError ? err : new AppError(err);
            }
        }
    }
    validateAndAssignListingParameters(updationData, listingData);
    let transaction;
    try {
        transaction = await listingsRepository.createTransaction();
        await listingsRepository.updateWithTransaction(
            {
                data: updationData,
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: listingId,
                    },
                ],
            },
            transaction
        );

        let responseCityIds;
        if (cityIds && cityIds.length > 0) {
            await updateCityMappings(
                updationData,
                listingId,
                cityIds,
                transaction,
                roleId,
                cityAdminMap,
                listingData.statusId
            );
            responseCityIds = cityIds;
        } else {
            const cityMappingData = await cityListingMappingRepo.getAll({
                filters: [
                    {
                        key: "listingId",
                        sign: "=",
                        value: listingId,
                    },
                ],
            });
            responseCityIds = cityMappingData.rows.map(
                (mapping) => mapping.cityId
            );
        }
        const isPollCategory = listingData.categoryId === categories.Polls;
        if (isPollCategory) {
            validatePollOptions(listingData.pollOptions);
            await managePollOptions(
                listingData.pollOptions,
                listingId,
                transaction
            );
        } else {
            updationData.subcategoryId = null;
            delete listingData.subcategoryId;
        }

        await listingsRepository.commitTransaction(transaction);
        return responseCityIds.map((cityId) => {
            return {
                cityId,
                listingId,
            };
        });
    } catch (err) {
        await listingsRepository.rollbackTransaction(transaction);
        throw err instanceof AppError ? err : new AppError(err);
    }
};

const window = new JSDOM("").window;
const domPurify = DOMPurify(window);

const checkDesc = (inputHtml) => {
    return domPurify.sanitize(inputHtml, {
        ALLOWED_TAGS: [
            "b",
            "i",
            "u",
            "em",
            "strong",
            "a",
            "ul",
            "ol",
            "li",
            "br",
            "p",
            "div",
            "span",
            "blockquote",
            "code",
            "pre",
            "h1",
            "h2",
            "h3",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "style"],
    });
};

async function addDefaultImage(transaction, listingId, categoryId) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find(
        (key) => categories[key] === +categoryId
    );
    const countQuery = await listingsImageRepository.getOne({
        filters: [
            {
                key: "logo",
                sign: "LIKE",
                value: `%${categoryName}%`,
            },
        ],
        columns: ["count(id) as LICount"],
    });
    const categoryCount = countQuery.LICount;
    const moduloValue =
        (categoryCount % defaultImageCount[categoryName] || 0) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    return await listingsImageRepository.createWithTransaction(
        {
            data: {
                listingId,
                imageOrder,
                logo: imageName,
            },
        },
        transaction
    );
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
            throw err;
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
        if (
            response.rows &&
            (response.rows.length === 0 ||
                response.rows.length !== cityIds.length)
        ) {
            const invalidCityIds = cityIds.filter((cityId) => {
                return !response.rows.some((city) => city.id === cityId);
            });
            throw new AppError(
                `Invalid City '${invalidCityIds[0]}' given`,
                400
            );
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
    if (
        !pollOptions ||
        !Array.isArray(pollOptions) ||
        pollOptions.length === 0
    ) {
        throw new AppError(`Invalid Poll Options`, 400);
    }
    if (pollOptions.length > 10) {
        throw new AppError(`Poll Options cannot exceed 10 items`, 400);
    }
    const titles = pollOptions.map((opt) => opt.title);
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
            ],
        });
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(err, 500);
    }

    const existingIds = existingOptions.rows.map((opt) => opt.id);
    const incomingIds = pollOptions.map((opt) => opt.id).filter(Boolean);

    for (const id of existingIds) {
        if (!incomingIds.includes(id)) {
            await pollOptionsRepository.deleteWithTransaction(
                {
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: id,
                        },
                    ],
                },
                transaction
            );
        }
    }
    try {
        for (const option of pollOptions) {
            if (option.id && existingIds.includes(option.id)) {
                await pollOptionsRepository.updateWithTransaction(
                    {
                        data: {
                            title: option.title,
                        },
                        filters: [
                            {
                                key: "id",
                                sign: "=",
                                value: option.id,
                            },
                        ],
                    },
                    transaction
                );
            } else {
                await pollOptionsRepository.createWithTransaction(
                    {
                        data: {
                            listingId,
                            title: option.title,
                        },
                    },
                    transaction
                );
            }
        }
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
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
        const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
        if (!phoneRegex.test(payload.phone)) {
            throw next(new AppError(`Invalid phone number format`, 400));
        }
        updationData.phone = payload.phone;
    }

    if (payload.logo && payload.removeImage) {
        throw new AppError(
            `Invalid Input, logo and removeImage both fields present`,
            400
        );
    }

    if (payload.pdf && payload.removePdf) {
        throw new AppError(
            `Invalid Input, pdf and removePdf both fields present`,
            400
        );
    }

    if (payload.pdf) {
        updationData.pdf = payload.pdf;
    }
    if (payload.removePdf) {
        updationData.pdf = null;
    }

    // Assign other payload fields
    const allowedFields = [
        "place",
        "media",
        "address",
        "price",
        "discountPrice",
        "zipcode",
        "website",
        "longitude",
        "latitude",
    ];
    for (const field of allowedFields) {
        if (payload[field] !== undefined) {
            updationData[field] = payload[field];
        }
    }
}

async function updateCityMappings(
    updationData,
    listingId,
    updatedCityIds,
    transaction,
    roleId,
    cityAdminMap = {},
    statusId
) {
    if (!Array.isArray(updatedCityIds) || updatedCityIds.length === 0) {
        return;
    }
    try {
        const cityDetailsResponse = await citiesRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "IN",
                    value: updatedCityIds,
                },
            ],
            columns: ["id", "name"],
        });

        const cityDetailsMap = cityDetailsResponse.rows.map((city) => [
            city.id,
            city.name,
        ]);

        await cityListingMappingRepo.deleteWithTransaction(
            { filters: [{ key: "listingId", sign: "=", value: listingId }] },
            transaction
        );
        const data = updatedCityIds.map((cityId, index) => {
            const mappingStatus =
                roleId === roles.Admin || cityAdminMap[cityId]
                    ? statusId || status.Active
                    : status.Pending;
            return {
                listingId,
                cityId,
                cityOrder: index + 1, // Maintain order
                status: mappingStatus,
            };
        });

        await Promise.all(
            data.map(
                async (cityListingsMapping) =>
                    await cityListingMappingRepo.createWithTransaction(
                        { data: cityListingsMapping },
                        transaction
                    )
            )
        );

        const activeListeningCityIds = data
            ?.filter((mapping) => mapping.status === status.Active)
            .map((mapping) => mapping.cityId);

        if (
            parseInt(updationData.categoryId) === categories.News &&
            parseInt(updationData.subcategoryId) === subcategories.newsflash &&
            activeListeningCityIds?.length &&
            roleId === roles.Admin
        ) {
            const notifications = activeListeningCityIds.map((cityId) => ({
                topic: "warnings",
                title: "Eilmeldung",
                message: `${cityDetailsMap.get(cityId) || "Unknown"} - ${
                    updationData.title
                }`,
                payload: {
                    cityId: cityId.toString(),
                    id: listingId.toString(),
                },
            }));

            // Send notifications in parallel
            await Promise.all(
                notifications.map((notification) =>
                    sendPushNotification.sendPushNotificationToAll(
                        notification.topic,
                        notification.title,
                        notification.message,
                        notification.payload
                    )
                )
            );
        }
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(err, 500);
    }
}

async function buildCompleteListingData(listingId) {
    try {
        // Get basic listing data
        const data = await listingsRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: listingId,
                },
            ],
        });

        if (!data) {
            throw new AppError(
                `Listing with id ${listingId} does not exist`,
                404
            );
        }

        // Get city mappings
        const cityListingMappings = await cityListingMappingRepo.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ],
            orderBy: ["cityOrder"],
        });

        const allCities = cityListingMappings.rows.map(
            (mapping) => mapping.cityId
        );
        data.allCities = allCities;
        data.cityId = allCities.length > 0 ? allCities[0] : null;

        // Get images for the listing
        const listingImageListResp = await listingsImageRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ],
        });

        const listingImageList = listingImageListResp.rows;
        const logo =
            listingImageList && listingImageList.length > 0
                ? listingImageList[0].logo
                : null;

        data.logo = logo;
        data.logoCount = listingImageList ? listingImageList.length : 0;
        data.otherLogos = listingImageList || [];

        // Get city data for each city
        const cityData = [];
        for (const cityId of allCities) {
            const cityInfo = await citiesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: cityId,
                    },
                ],
            });

            if (cityInfo) {
                // Get listing status for this specific city
                const cityMapping = cityListingMappings.rows.find(
                    (m) => m.cityId === cityId
                );
                cityData.push({
                    id: cityInfo.id,
                    name: cityInfo.name,
                    image: cityInfo.image,
                    listingStatus: cityMapping ? cityMapping.status : null,
                });
            }
        }

        data.cityCount = allCities.length;
        data.cityData = cityData;

        // Get poll options if it's a poll
        if (data.categoryId === categories.Polls) {
            const pollOptionResp = await pollOptionsRepository.getAll({
                filters: [
                    {
                        key: "listingId",
                        sign: "=",
                        value: listingId,
                    },
                ],
            });
            data.pollOptions = pollOptionResp?.rows ?? [];
        }

        // Add language detection defaults
        data.isOngoing = 0;
        data.titleLanguage = "auto";
        data.descriptionLanguage = "auto";

        delete data.viewCount;
        return data;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

module.exports = { createListing, updateListing };
