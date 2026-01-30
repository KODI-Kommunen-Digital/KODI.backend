const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");
const listingImagesRepository = require("../repository/listingsImagesRepo");
const pollRepository = require("../repository/pollOptionsRepo");
const listingRepository = require("../repository/listingsRepo");
const listingChatsRepository = require("../repository/listingChatsRepo");
const cityRepository = require("../repository/citiesRepo");
const statusRepository = require("../repository/statusRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const subcategoriesRepository = require("../repository/subcategoriesRepo");
const cityListingMappingRepo = require("../repository/cityListingMappingRepo");
const usersRepository = require("../repository/userRepo");
const recurrenceRulesRepo = require("../repository/recurrenceRulesRepo");
const recurrenceExceptionsRepo = require("../repository/recurrenceExceptionsRepo");
const { RecurrenceSerializer, RecurrenceGenerator } = require("./recurrence");

const listingFunctions = require("../services/listingFunctions");
const status = require("../constants/status");
const source = require("../constants/source");
const imageUpload = require("../utils/imageUpload");
const getPdfImage = require("../utils/getPdfImage");
const pdfUpload = require("../utils/pdfUpload");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const axios = require("axios");
const roles = require("../constants/roles");
const categories = require("../constants/categories");
const defaultImageCount = require("../constants/defaultImagesInBucketCount");
const DEFAULTIMAGE = "Defaultimage";
const isValidDate = require("../utils/validateDate");
const listingChatReactionRepo = require("../repository/listingChatReactionRepo");
const { sendPushNotifications } = require("./sendPushNotification");
// const sendPushNotificationsToUsers =
//     require("./sendPushNotification").sendPushNotificationsToUsers;
// const sendPushNotificationsToAdmin =
//     require("./sendPushNotification").sendPushNotificationsToAdmin;

const getAllListings = async ({
    pageNo,
    pageSize,
    sortByStartDate,
    statusId,
    subcategoryId,
    categoryId,
    cityId,
    reqTranslate,
    showExternalListings,
    isAdmin,
    startAfterDate,
    endBeforeDate,
    dateFilter,
    eventType,  // singleDay, multiDay, recurring (only for events category)
}) => {
    const filters = [];
    let sortByStartDateBool = false;
    let cities = [];

    if (isNaN(pageNo) || pageNo <= 0) {
        throw new AppError("Please enter a positive integer for pageNo", 400);
    }

    if (isNaN(pageSize) || pageSize <= 0 || pageSize > 20) {
        throw new AppError(
            "Please enter a positive integer less than or equal to 20 for pageSize",
            400
        );
    }

    if (sortByStartDate) {
        const sortByStartDateString = sortByStartDate.toString();
        if (
            sortByStartDateString !== "true" &&
            sortByStartDateString !== "false"
        ) {
            throw new AppError(
                "The parameter sortByCreatedDate can only be a boolean",
                400
            );
        } else {
            sortByStartDateBool = sortByStartDateString === "true";
        }
    }
    if (isAdmin) {
        if (statusId) {
            // const response = await cityListingRepo.getStatusById(statusId);
            const response = await statusRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: statusId,
                    },
                ],
            }); // removing the cityId
            if (!response) {
                throw new AppError(`Invalid Status '${statusId}' given`, 400);
            }
            // filters.statusId = statusId;
            filters.push({
                key: "statusId",
                sign: "=",
                value: statusId,
            });
        }
    } else {
        // filters.statusId = status.Active;
        filters.push({
            key: "statusId",
            sign: "=",
            value: status.Approved,
        });
    }

    if (categoryId) {
        // const category = await cityListingRepo.getCategoryById(categoryId);
        const categoryResp = await categoriesRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: categoryId,
                },
                {
                    key: "isEnabled",
                    sign: "=",
                    value: true,
                },
            ],
        });
        if (!categoryResp || !categoryResp.rows || !categoryResp.rows.length) {
            throw new AppError(`Invalid Category '${categoryId}' given`, 400);
        }

        if (subcategoryId) {
            const subcategory =
                // await cityListingRepo.getSubCategoryById(subcategoryId);
                await subcategoriesRepository.getAll({
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: subcategoryId,
                        },
                    ],
                });
            // if (!subcategory) {
            if (!subcategory || !subcategory.rows || !subcategory.rows.length) {
                throw new AppError(
                    `Invalid subCategory '${subcategoryId}' given`,
                    400
                );
            }
            // filters.subcategoryId = subcategoryId;
            filters.push({
                key: "subcategoryId",
                sign: "=",
                value: subcategoryId,
            });
        }
        // filters.categoryId = categoryId;
        filters.push({
            key: "categoryId",
            sign: "=",
            value: categoryId,
        });
    }

    if (dateFilter) {
        const currentDate = new Date();
        switch (dateFilter.toLowerCase()) {
            case "today":
                startAfterDate = currentDate.toISOString().split("T")[0];
                endBeforeDate = startAfterDate;
                break;
            case "week": {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(
                    currentDate.getDate() - currentDate.getDay() + 1
                ); // Start of the week (Monday)
                startAfterDate = startOfWeek.toISOString().split("T")[0];
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Sunday)
                endBeforeDate = endOfWeek.toISOString().split("T")[0];
                break;
            }
            case "month": {
                const startOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    1
                ); // Start of the month
                startAfterDate = startOfMonth.toISOString().split("T")[0];
                const endOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    0
                ); // End of the month
                endBeforeDate = endOfMonth.toISOString().split("T")[0];
                break;
            }
            default:
                throw new AppError(
                    "Invalid filterBy value. Allowed values are 'today', 'week', or 'month'.",
                    400
                );
        }
    }

    if (startAfterDate && !isValidDate(startAfterDate)) {
        throw new AppError(
            `Invalid Date given '${startAfterDate}', formate Should be YYYY-MM-DD`,
            400
        );
    }

    if (endBeforeDate && !isValidDate(endBeforeDate)) {
        throw new AppError(
            `Invalid Date given '${endBeforeDate}', formate Should be YYYY-MM-DD`,
            400
        );
    }

    if (cityId) {
        // const city = await cityRepo.getCityWithId(cityId);
        // Validate the cityId input to ensure it only contains integers separated by commas
        if (!/^\d+(,\d+)*$/.test(cityId)) {
            throw new AppError(
                `Invalid format for CityId '${cityId}'. Please provide a comma-separated list of integers.`,
                400
            );
        }

        // Parse the cityId string to an array of integers
        const cityIds = cityId.split(",").map((id) => parseInt(id.trim(), 10));

        // Retrieve cities using the parsed array of IDs
        const citiesResp = await cityRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "IN",
                    value: cityIds,
                },
            ],
        });

        // Throw an error if no cities are found
        if (!citiesResp.count) {
            throw new AppError(
                `No cities found for provided CityId(s) '${cityId}'`,
                400
            );
        }

        // Check if the number of cities retrieved matches the number of IDs provided
        if (citiesResp.count !== cityIds.length) {
            // Find missing IDs by filtering out those that were found in the database
            const foundIds = citiesResp.map((city) => city.id);
            const missingIds = cityIds.filter((id) => !foundIds.includes(id));
            throw new AppError(
                `The following CityId(s) are invalid: ${missingIds.join(", ")}`,
                404
            );
        }
        cities = cityIds;
    } else {
        // cities = await cityRepo.getCities();
        const citiesResp = await cityRepository.getAll({
            columns: "id,name,image, hasForum",
            sort: ["name"],
        });
        cities = citiesResp?.rows?.map((city) => city.id) ?? [];
    }

    if (showExternalListings !== "true") {
        // filters.sourceId = source.UserEntry;
        filters.push({
            key: "sourceId",
            sign: "=",
            value: source.UserEntry,
        });
    }

    // Validate eventType if provided for Events category
    let eventTypeFilter = null;
    if (eventType && categoryId && parseInt(categoryId) === categories.Events) {
        const validEventTypes = ['singleDay', 'multiDay', 'recurring'];
        if (!validEventTypes.includes(eventType)) {
            throw new AppError(
                `Invalid eventType '${eventType}'. Allowed values are: ${validEventTypes.join(', ')}`,
                400
            );
        }
        eventTypeFilter = eventType;
    }

    try {
        const listings = await listingRepository.retrieveListings({
            filters,
            pageNo,
            pageSize,
            cities,
            sortByStartDate: sortByStartDateBool,
            startAfterDate, // Start date for range
            endBeforeDate,
            eventType: eventTypeFilter,  // Pass to repository for DB-level filtering
        });

        const noOfListings = listings.length;
        if (
            noOfListings > 0 &&
            reqTranslate &&
            supportedLanguages.includes(reqTranslate)
        ) {
            const textToTranslate = [];
            listings.forEach((listing) => {
                textToTranslate.push(listing.title);
                textToTranslate.push(listing.description);
            });
            const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);
            const translations = await translator.translateText(
                textToTranslate,
                null,
                reqTranslate
            );
            for (let i = 0; i < noOfListings; i++) {
                if (
                    translations[2 * i].detectedSourceLang !==
                    reqTranslate.slice(0, 2)
                ) {
                    listings[i].titleLanguage =
                        translations[2 * i].detectedSourceLang;
                    listings[i].titleTranslation = translations[2 * i].text;
                }
                if (
                    translations[2 * i + 1].detectedSourceLang !==
                    reqTranslate.slice(0, 2)
                ) {
                    listings[i].descriptionLanguage =
                        translations[2 * i + 1].detectedSourceLang;
                    listings[i].descriptionTranslation =
                        translations[2 * i + 1].text;
                }
            }
        }
        // Fetch recurrence rules for each listing (supports multiple rules)
        const listingsWithRecurrence = await Promise.all(listings.map(async (listing) => {
            const recurrenceRules = [];
            const rules = await recurrenceRulesRepo.getAllByListingId(listing.id);

            for (const rule of rules) {
                const exceptionsResp = await recurrenceExceptionsRepo.getAll({
                    filters: [{ key: "recurrenceRuleId", sign: "=", value: rule.id }]
                });
                const exceptions = exceptionsResp.rows || [];
                recurrenceRules.push(RecurrenceSerializer.toApiResponse(rule, listing, exceptions));
            }

            const isRecurrence = recurrenceRules.length > 0;
            return {
                ...listing,
                isRecurrence,
                recurrenceRules
            };
        }));

        return listingsWithRecurrence;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const searchListings = async ({
    pageNo,
    pageSize,
    sortByStartDate,
    statusId,
    cityId,
    searchQuery,
    categoryId,
    subcategoryId,
    eventType,  // singleDay, multiDay, recurring (only for events category)
    startAfterDate,
    endBeforeDate,
    dateFilter,
    isAdmin,
}) => {
    const filters = [];
    let cities = [];
    let sortByStartDateBool = false;

    // Validate page parameters
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        throw new AppError("Please enter a positive integer for pageNo", 400);
    }
    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        throw new AppError(
            "Please enter a positive integer less than or equal to 20 for pageSize",
            400
        );
    }

    // Get cities
    if (cityId) {
        // const city = await cityRepo.getCityWithId(cityId);
        const city = await cityRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: cityId,
                },
            ],
        });
        if (!city) {
            throw new AppError(`Invalid CityId '${cityId}' given`, 400);
        }
        cities = [city];
    } else {
        // cities = await cityRepo.getCities();
        const citiesResp = await cityRepository.getAll({
            columns: "id,name,image, hasForum",
            sort: ["name"],
        });
        cities = citiesResp?.rows ?? [];
        if (cities.count === 0) {
            throw new AppError("No cities found", 404);
        }
    }

    // Validate and set sortByStartDate
    if (sortByStartDate) {
        const sortByStartDateString = sortByStartDate.toString();
        if (
            sortByStartDateString !== "true" &&
            sortByStartDateString !== "false"
        ) {
            throw new AppError(
                "The parameter sortByCreatedDate can only be a boolean",
                400
            );
        }
        sortByStartDateBool = sortByStartDateString === "true";
    }

    // Validate and add status filter
    if (isAdmin && statusId) {
        if (isNaN(Number(statusId)) || Number(statusId) <= 0) {
            throw new AppError(`Invalid status ${statusId}`, 400);
        }
        // const status = await statusRepo.getStatusById(statusId);
        const statusResp = await statusRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: statusId,
                },
            ],
        });
        if (!statusResp) {
            throw new AppError(`Invalid Status '${statusId}' given`, 400);
        }
        // filters.statusId = statusId;
        filters.push({
            key: "statusId",
            sign: "=",
            value: statusId,
        });
    } else {
        // filters.statusId = status.Active;
        filters.push({
            key: "statusId",
            sign: "=",
            value: status.Active,
        });
    }

    // Validate and add category filter
    if (categoryId) {
        const categoryResp = await categoriesRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: categoryId,
                },
                {
                    key: "isEnabled",
                    sign: "=",
                    value: true,
                },
            ],
        });
        if (!categoryResp || !categoryResp.rows || !categoryResp.rows.length) {
            throw new AppError(`Invalid Category '${categoryId}' given`, 400);
        }

        if (subcategoryId) {
            const subcategory = await subcategoriesRepository.getAll({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: subcategoryId,
                    },
                ],
            });
            if (!subcategory || !subcategory.rows || !subcategory.rows.length) {
                throw new AppError(
                    `Invalid subCategory '${subcategoryId}' given`,
                    400
                );
            }
            filters.push({
                key: "subcategoryId",
                sign: "=",
                value: subcategoryId,
            });
        }
        filters.push({
            key: "categoryId",
            sign: "=",
            value: categoryId,
        });
    }

    // Handle dateFilter to set startAfterDate and endBeforeDate
    if (dateFilter) {
        const currentDate = new Date();
        switch (dateFilter.toLowerCase()) {
            case "today":
                startAfterDate = currentDate.toISOString().split("T")[0];
                endBeforeDate = startAfterDate;
                break;
            case "week": {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(
                    currentDate.getDate() - currentDate.getDay() + 1
                ); // Start of the week (Monday)
                startAfterDate = startOfWeek.toISOString().split("T")[0];
                const endOfWeek = new Date(currentDate);
                endOfWeek.setDate(
                    currentDate.getDate() - currentDate.getDay() + 7
                ); // End of the week (Sunday)
                endBeforeDate = endOfWeek.toISOString().split("T")[0];
                break;
            }
            case "month": {
                const startOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    1
                ); // Start of the month
                startAfterDate = startOfMonth.toISOString().split("T")[0];
                const endOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    0
                ); // End of the month
                endBeforeDate = endOfMonth.toISOString().split("T")[0];
                break;
            }
            default:
                throw new AppError(
                    "Invalid filterBy value. Allowed values are 'today', 'week', or 'month'.",
                    400
                );
        }
    }

    if (startAfterDate && !isValidDate(startAfterDate)) {
        throw new AppError(
            `Invalid Date given '${startAfterDate}', formate Should be YYYY-MM-DD`,
            400
        );
    }

    if (endBeforeDate && !isValidDate(endBeforeDate)) {
        throw new AppError(
            `Invalid Date given '${endBeforeDate}', formate Should be YYYY-MM-DD`,
            400
        );
    }

    // Validate eventType if provided for Events category
    let eventTypeFilter = null;
    if (eventType && categoryId && parseInt(categoryId) === categories.Events) {
        const validEventTypes = ['singleDay', 'multiDay', 'recurring'];
        if (!validEventTypes.includes(eventType)) {
            throw new AppError(
                `Invalid eventType '${eventType}'. Allowed values are: ${validEventTypes.join(', ')}`,
                400
            );
        }
        eventTypeFilter = eventType;
    }

    try {
        const listings = await listingRepository.retrieveListings({
            filters,
            cities: cities.map((city) => city.id),
            searchQuery,
            pageNo,
            pageSize,
            sortByStartDate: sortByStartDateBool,
            startAfterDate,
            endBeforeDate,
            eventType: eventTypeFilter,  // Pass to repository for DB-level filtering
        });

        // Fetch recurrence rules for each listing (supports multiple rules)
        const listingsWithRecurrence = await Promise.all(listings.map(async (listing) => {
            const { viewCount, ...listingWithoutViewCount } = listing;
            const recurrenceRules = [];
            const rules = await recurrenceRulesRepo.getAllByListingId(listing.id);

            for (const rule of rules) {
                const exceptionsResp = await recurrenceExceptionsRepo.getAll({
                    filters: [{ key: "recurrenceRuleId", sign: "=", value: rule.id }]
                });
                const exceptions = exceptionsResp.rows || [];
                recurrenceRules.push(RecurrenceSerializer.toApiResponse(rule, listing, exceptions));
            }

            const isRecurrence = recurrenceRules.length > 0;
            return {
                ...listingWithoutViewCount,
                isRecurrence,
                recurrenceRules
            };
        }));

        return listingsWithRecurrence;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error searching listings: ${err.message}`);
    }
};

const createListing = async ({ cityIds, listingData, userId, roleId }) => {
    try {
        const createdListings = await listingFunctions.createListing(
            cityIds,
            listingData,
            userId,
            roleId
        );
        return createdListings;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error creating listing: ${err.message}`);
    }
};

const updateListing = async ({
    listingId,
    cityIds,
    listingData,
    userId,
    roleId,
}) => {
    try {
        const updatedListing = await listingFunctions.updateListing(
            listingId,
            cityIds,
            listingData,
            userId,
            roleId
        );
        return updatedListing;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error updating listing: ${err.message}`);
    }
};

const getListingWithId = async function (id, repeatedRequest = false) {
    try {
        // const data = await listingRepo.getCityListingWithId(id, cityId);
        const data = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ],
        });
        if (!data) {
            throw new AppError(`Listings with id ${id} does not exist`, 404);
        }

        // const data = await listingRepo.getCityListingWithId(id, cityId);
        const cityListingMappings = await cityListingMappingRepo.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ],
            orderBy: ["cityOrder"],
        });

        const allCities = cityListingMappings.rows.map(
            (cityListingMapping) => cityListingMapping.cityId
        );

        data.allCities = allCities;
        data.cityId = allCities.length > 0 ? allCities[0] : null;

        const listingImageListResp = await listingImagesRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ],
        });
        const listingImageList = listingImageListResp.rows;
        const logo =
            listingImageList && listingImageList.length > 0
                ? listingImageList[0].logo
                : null;

        if (process.env.IS_LISTING_VIEW_COUNT && !repeatedRequest) {
            // await listingRepo.setViewCount(id, data.viewCount + 1, cityId);
            await listingRepository.update({
                data: {
                    viewCount: data.viewCount + 1,
                },
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: id,
                    },
                ],
            });
        }

        if (data.categoryId === categories.Polls) {
            // data.pollOptions = await pollRepo.getPollOptions(id, cityId);
            const pollOptionResp = await pollRepository.getAll({
                filters: [
                    {
                        key: "listingId",
                        sign: "=",
                        value: id,
                    },
                ],
            });
            data.pollOptions = pollOptionResp?.rows ?? [];
        }

        delete data.viewCount;

        // Fetch all recurrence rules for this listing
        const recurrenceRules = [];
        const allUpcomingDates = [];
        const rules = await recurrenceRulesRepo.getAllByListingId(id);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        for (const rule of rules) {
            const exceptionsResp = await recurrenceExceptionsRepo.getAll({
                filters: [{ key: "recurrenceRuleId", sign: "=", value: rule.id }]
            });
            const exceptions = exceptionsResp.rows || [];
            recurrenceRules.push(RecurrenceSerializer.toApiResponse(rule, data, exceptions));

            // Generate future occurrences for this rule (passing today as fromDate)
            // Use the rule's own startDate and repeatUntil instead of listing dates
            try {
                const occurrences = RecurrenceGenerator.generateOccurrences(
                    rule,
                    rule.startDate || data.startDate,   // Use rule's own start date
                    rule.repeatUntil || data.endDate,   // Use rule's own repeat until date
                    exceptions,
                    today  // Only generate occurrences from today onwards
                );

                // Add non-exception occurrences
                for (const occ of occurrences) {
                    if (!occ.isException) {
                        allUpcomingDates.push({
                            startDate: occ.startDate,
                            endDate: occ.endDate
                        });
                    }
                }
            } catch (err) {
                // If generation fails, skip but don't break the response
                console.error('Error generating occurrences:', err.message);
            }
        }

        // Sort upcoming dates: nearest (most recent) at top, future at bottom
        allUpcomingDates.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        const isRecurrence = recurrenceRules.length > 0;

        return {
            ...data,
            logo,
            otherLogos: listingImageList,
            isRecurrence,
            recurrenceRules,
            upcomingDates: allUpcomingDates
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteListing = async function (id, userId, roleId) {
    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: id,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    const transaction = await listingRepository.createTransaction();
    try {
        // Get images from listing_images table for this listing
        const listingImagesResp = await listingImagesRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ],
        });
        const listingImages = listingImagesResp?.rows || [];

        // Delete each image that does not start with "admin/"
        for (const image of listingImages) {
            if (
                image.logo &&
                typeof image.logo === "string" &&
                !image.logo.startsWith("admin/") &&
                !image.logo.startsWith("https://")
            ) {
                await imageDeleteAsync.deleteImage(image.logo);
            }
        }

        if (currentListingData.pdf) {
            await imageDeleteAsync.deleteImage(currentListingData.pdf);
        }

        await listingImagesRepository.deleteWithTransaction(
            {
                filters: [
                    {
                        key: "listingId",
                        sign: "=",
                        value: id,
                    },
                ],
            },
            transaction
        );
        await listingRepository.deleteWithTransaction(
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
        await listingRepository.commitTransaction(transaction);
    } catch (err) {
        console.log({ err });
        await listingRepository.rollbackTransaction(transaction);
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

// Define allowed statuses
const allowedStatuses = [1, 2, 3];

// Function to check if a status transition is allowed
const isValidTransition = (currentStatus, newStatus) => {
    // Allow transitions from pending (2) to approved (1) or feedback (3)
    if (currentStatus === 2 && (newStatus === 1 || newStatus === 3)) {
        return true;
    }
    // Allow transition from feedback (3) to approved (1)
    if (currentStatus === 3 && newStatus === 1) {
        return true;
    }
    return false;
};
const updateListingStatus = async function ({ id, roleId, newStatus }) {
    if (roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    try {
        // check if listing exists
        const listing = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ],
        });
        if (!listing) {
            throw new AppError(`Listing with id ${id} does not exist`, 404);
        }
        if (!allowedStatuses.includes(newStatus)) {
            throw new AppError(
                `Invalid status: ${newStatus} does not exist`,
                400
            );
        }
        if (!isValidTransition(listing.statusId, newStatus)) {
            throw new AppError(
                `Cannot change status from ${listing.statusId} to ${newStatus}.`,
                400
            );
        }

        const update = await listingRepository.update({
            data: {
                statusId: newStatus,
            },
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ],
        });
        console.log("everything is fine here");
        try {
            console.log("sending push notification to user", listing.userId);
            const result = await sendPushNotifications(
                [listing.userId],
                "Listing Status Updated",
                `Your listing status has been updated to ${newStatus === 3 ? "Feedback" : "Approved"
                } `,
                {
                    type: "listing_status_update",
                    listingId: id,
                }
            );
            console.log({ result });
        } catch (err) {
            console.log({ err });
        }

        return update;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error updating listing: ${err.message}`);
    }
};

const postChatReaction = async function ({
    userId,
    roleId,
    chatId,
    reaction,
    listingId,
}) {
    try {
        if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
            throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
        }
        if (!reaction) {
            throw new AppError(`Reaction is required`, 400);
        }
        const currentListingData = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: listingId,
                },
            ],
        });
        if (!currentListingData) {
            throw new AppError(
                `Listing with id ${listingId} does not exist`,
                404
            );
        }
        if (currentListingData.statusId !== 3) {
            throw new AppError(
                `Listing with id ${listingId} does not have feedback status`,
                400
            );
        }
        if (roleId !== roles.Admin && currentListingData.userId !== userId) {
            throw new AppError(
                `You are not allowed to access this resource`,
                403
            );
        }
        const existingReaction = await listingChatReactionRepo.getOne({
            filters: [
                { key: "chatId", sign: "=", value: chatId },
                { key: "userId", sign: "=", value: userId },
            ],
        });
        const websocketChannelId = `listing_${listingId}`;
        const user = await usersRepository.getOne({
            filters: [{ key: "id", sign: "=", value: userId }],
        });
        const payload = { userId, chatId, reaction, username: user.username };

        if (existingReaction) {
            if (existingReaction.reaction === reaction) {
                return existingReaction;
            }
            const updated = await listingChatReactionRepo.update({
                filters: [{ key: "id", sign: "=", value: existingReaction.id }],
                data: { reaction },
            });

            // Send live reaction update via websocket
            if (process.env.WEBSOCKET_ENABLED) {
                await axios.post(
                    `${process.env.WEBSOCKET_SERVER_ADDR}/publish/${websocketChannelId}?accessToken=${process.env.WEBSOCKET_ACCESS_TOKEN}`,
                    { type: "reactionUpdate", data: payload }
                );
            }
            return updated;
        }
        const data = {
            chatId,
            userId,
            reaction,
        };
        const result = await listingChatReactionRepo.create({
            data,
        });
        // Send live reaction update via websocket
        if (process.env.WEBSOCKET_ENABLED) {
            await axios.post(
                `${process.env.WEBSOCKET_SERVER_ADDR}/publish/${websocketChannelId}?accessToken=${process.env.WEBSOCKET_ACCESS_TOKEN}`,
                { type: "reactionUpdate", data: payload }
            );
        }
        return result;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};
const deleteChatReaction = async function ({
    userId,
    roleId,
    chatId,
    listingId,
}) {
    try {
        if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
            throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
        }
        const currentListingData = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: listingId,
                },
            ],
        });
        if (!currentListingData) {
            throw new AppError(
                `Listing with id ${listingId} does not exist`,
                404
            );
        }
        if (currentListingData.statusId !== 3) {
            throw new AppError(
                `Listing with id ${listingId} does not have feedback status`,
                400
            );
        }
        if (roleId !== roles.Admin && currentListingData.userId !== userId) {
            throw new AppError(
                `You are not allowed to access this resource`,
                403
            );
        }
        const result = await listingChatReactionRepo.delete({
            filters: [
                { key: "chatId", sign: "=", value: chatId },
                { key: "userId", sign: "=", value: userId },
            ],
        });
        // Send live reaction deletion via websocket
        const websocketChannelId = `listing_${listingId}`;
        const payload = { chatId, userId };
        if (process.env.WEBSOCKET_ENABLED) {
            await axios.post(
                `${process.env.WEBSOCKET_SERVER_ADDR}/publish/${websocketChannelId}?accessToken=${process.env.WEBSOCKET_ACCESS_TOKEN}`,
                { type: "reactionDeleted", data: payload }
            );
        }
        return result;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const handleUnifiedChat = async ({
    listingId,
    userId,
    roleId,
    message,
    parentId,
    file,
}) => {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId}`, 400);
    }

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }
    if (currentListingData.statusId !== 3) {
        throw new AppError(
            `Listing with id ${listingId} does not have feedback status`,
            400
        );
    }
    if (roleId !== roles.Admin && currentListingData.userId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    const websoketChannelId = `listing_${listingId}`;

    // If parent ID is provided, validate it
    if (parentId !== undefined && parentId !== null) {
        if (isNaN(Number(parentId)) || Number(parentId) <= 0) {
            throw new AppError(`Invalid parent chat ID ${parentId}`, 400);
        }

        const parentChat = await listingChatsRepository.getOne({
            filters: [
                { key: "id", sign: "=", value: parentId },
                { key: "listingId", sign: "=", value: listingId },
            ],
        });

        if (!parentChat) {
            throw new AppError(
                `Parent message with id ${parent} not found in the listing`,
                400
            );
        }

        parentId = Number(parentId);
    }

    let fileUrl = null;

    if (file) {
        const isImage =
            file.mimetype === "image/png" ||
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/jpg";
        const isPdf = file.mimetype === "application/pdf";

        if (!isImage && !isPdf) {
            throw new AppError(`Unsupported file type ${file.mimetype}`, 415);
        }
        const fileExtension = isPdf ? "_PDF.pdf" : file.mimetype.split("/")[1];

        const filePath = `user_${userId}/listing_${listingId}_${Date.now()}.${fileExtension}`;
        const { uploadStatus, objectKey } = isPdf
            ? await pdfUpload(file, filePath)
            : await imageUpload(file, filePath);

        if (uploadStatus !== "Success") {
            throw new AppError("File upload failed");
        }

        fileUrl = objectKey;
    }

    if (!message && !fileUrl) {
        throw new AppError("Message or file is required", 400);
    }

    const chatData = {
        listingId,
        senderId: userId,
        senderType: roleId === roles.Admin ? "admin" : "user",
        parentId: parentId ? Number(parentId) : null,
        message: message || null,
        fileUrl,
    };
    const newChat = await listingChatsRepository.create({
        data: chatData,
    });

    // Get chat with full details like in getChats query
    const [chatWithDetails] = await listingChatsRepository.getChats({
        listingId,
        lastMessageId: newChat.id - 1,
        pageSize: 1,
    });

    try {
        if (process.env.WEBSOCKET_ENABLED) {
            console.log("sending websocket request");
            await axios.post(
                `${process.env.WEBSOCKET_SERVER_ADDR}/publish/${websoketChannelId}?accessToken=${process.env.WEBSOCKET_ACCESS_TOKEN}`,
                { type: "newMessage", data: chatWithDetails }
            );
        }
        const payload = {
            listingId: `${listingId}`,
            type: "listing_chat",
            messageId: `${chatWithDetails.id}`,
            sender: `${userId}`,
            ...(chatData.message && {
                message: chatData.message,
            }),
            ...(chatData.fileUrl && {
                fileUrl: chatData.fileUrl,
            }),
            ...(chatData.parentId && {
                parentId: `${chatData.parentId}`,
            }),
        };
        console.dir({ payload }, { depth: null });
        // Send push notifications
        if (roleId === roles.Admin) {
            // If admin sent message, notify listing creator
            console.log(
                "i am admin and sending push notification to user",
                currentListingData.userId
            );
            await sendPushNotifications(
                [currentListingData.userId],
                "New Message from Admin",
                message || "You received a new message",
                payload
            );
        } else {
            // If user sent message, notify admins
            console.log(
                "i am user and sending push notification to admin participants"
            );
            const adminParticipants =
                await listingChatsRepository.getAdminParticipants(listingId);
            if (adminParticipants && adminParticipants.length > 0) {
                const adminUserIds = adminParticipants.map((admin) => admin.id);
                await sendPushNotifications(
                    adminUserIds,
                    "New Message from User",
                    message || "You received a new message",
                    payload
                );
            }
        }
    } catch (err) {
        // Log error but don't throw since message is already saved
        // console.error("Error sending notifications:", err);
    }

    return chatWithDetails;
};

const createListingChat = async function ({
    userId,
    roleId,
    parentId,
    message,
    listingId,
}) {
    //
    try {
        if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
            throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
        }
        if (!message) {
            throw new AppError(`Message is required`, 400);
        }
        const currentListingData = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: listingId,
                },
            ],
        });
        if (!currentListingData) {
            throw new AppError(
                `Listing with id ${listingId} does not exist`,
                404
            );
        }
        if (currentListingData.statusId !== 3) {
            throw new AppError(
                `Listing with id ${listingId} does not have feedback status`,
                400
            );
        }
        if (roleId !== roles.Admin && currentListingData.userId !== userId) {
            throw new AppError(
                `You are not allowed to access this resource`,
                403
            );
        }
        // If parent ID is provided, validate it
        if (parentId !== undefined && parentId !== null) {
            if (isNaN(Number(parentId)) || Number(parentId) <= 0) {
                throw new AppError(`Invalid parent chat ID ${parentId}`, 400);
            }

            const parentChat = await listingChatsRepository.getOne({
                filters: [
                    { key: "id", sign: "=", value: parentId },
                    { key: "listingId", sign: "=", value: listingId },
                ],
            });

            if (!parentChat) {
                throw new AppError(
                    `Parent message with id ${parent} not found in the listing`,
                    400
                );
            }

            parentId = Number(parentId);
        }
        const data = {
            listingId,
            senderId: userId,
            senderType: roleId === roles.Admin ? "admin" : "user",
            parentId,
            message,
        };
        const result = await listingChatsRepository.create({
            data,
        });
        const response = await listingChatsRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: result.id,
                },
            ],
        });
        return response;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getListingChat = async function ({
    userId,
    roleId,
    listingId,
    lastMessageId,
    isReversed,
    pageNo,
    pageSize,
}) {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }
    // if (currentListingData.statusId !== 3) {
    //     throw new AppError(
    //         `Listing with id ${listingId} does not have feedback status`,
    //         400
    //     );
    // }
    if (roleId !== roles.Admin && currentListingData.userId !== userId) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    const result = await listingChatsRepository.getChats({
        listingId,
        lastMessageId,
        isReversed,
        pageNo,
        pageSize,
    });
    return result;
};

const chatUploadImage = async function (listingId, userId, roleId, image) {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }
    if (currentListingData.statusId !== 3) {
        throw new AppError(
            `Listing with id ${listingId} does not have feedback status`,
            400
        );
    }
    if (roleId !== roles.Admin && currentListingData.userId !== userId) {
        console.log({ roleId, [userId]: currentListingData.userId });
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    // add check for image mime type here
    const allowedMimeTypes = ["image/png"];
    if (!allowedMimeTypes.includes(image.mimetype)) {
        throw new AppError(
            `Unsupported image format '${image.mimetype}'.`,
            415
        );
    }
    const filePath = `user_${userId}/listing_${listingId}_${Date.now()}`;

    const { objectKey, uploadStatus } = await imageUpload(image, filePath);
    if (uploadStatus === "Success") {
        const data = {
            listingId,
            senderId: userId,
            senderType: roleId === roles.Admin ? "admin" : "user",
            fileUrl: objectKey,
        };
        const result = await listingChatsRepository.create({
            data,
        });
        const response = await listingChatsRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: result.id,
                },
            ],
        });
        return response;
    } else {
        throw new AppError("Image Upload failed");
    }
};
const chatUploadPdf = async function (listingId, userId, roleId, pdf) {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }
    if (currentListingData.statusId !== 3) {
        throw new AppError(
            `Listing with id ${listingId} does not have feedback status`,
            400
        );
    }
    if (roleId !== roles.Admin && currentListingData.userId !== userId) {
        console.log({ roleId, [userId]: currentListingData.userId });
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (!pdf) {
        throw new AppError(`Pdf not uploaded`, 400);
    }

    const arrayOfAllowedFiles = ["pdf"];
    const arrayOfAllowedFileTypes = ["application/pdf"];

    const fileExtension = pdf.name.slice(
        ((pdf.name.lastIndexOf(".") - 1) >>> 0) + 2
    );

    if (
        !arrayOfAllowedFiles.includes(fileExtension) ||
        !arrayOfAllowedFileTypes.includes(pdf.mimetype)
    ) {
        throw new AppError(`Invalid Pdf type`, 403);
    }
    try {
        const filePath = `user_${userId}/listing_${listingId}_${Date.now()}_PDF.pdf`;
        const { uploadStatus, objectKey } = await pdfUpload(pdf, filePath);

        if (uploadStatus === "Success") {
            const data = {
                listingId,
                senderId: userId,
                senderType: roleId === roles.Admin ? "admin" : "user",
                fileUrl: objectKey,
            };
            const result = await listingChatsRepository.create({
                data,
            });
            const response = await listingChatsRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: result.id,
                    },
                ],
            });
            // TODO: GENERATE NOTIFICATION(FIREBASE)
            return response;
        } else {
            throw new AppError("pdf Upload failed");
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};
const uploadImage = async function (
    listingId,
    userId,
    roleId,
    imageFiles,
    imageList
) {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    // Add check: if user is not admin, statusId should not be status.approved
    if (
        roleId !== roles.Admin &&
        currentListingData.statusId === status.Approved
    ) {
        throw new AppError(
            `You are not allowed to upload images for an approved listing.`,
            403
        );
    }

    if (currentListingData.pdf && currentListingData.pdf.length > 0) {
        throw new AppError(
            `Pdf is present in listing So can not upload image.`,
            403
        );
    }

    const imageArr = imageFiles
        ? imageFiles.length > 1
            ? imageFiles
            : [imageFiles]
        : [];
    const hasIncorrectMime = imageArr.some(
        (i) => !i.mimetype.includes("image/")
    );
    if (hasIncorrectMime) {
        throw new AppError(`Invalid Image type`, 403);
    }

    let imageOrder = 0;
    // const listingImages = await cityListingRepo.getListingImages(
    const listingImagesResp = await listingImagesRepository.getAll({
        filters: [
            {
                key: "listingId",
                sign: "=",
                value: listingId,
            },
        ],
    });
    const listingImages = listingImagesResp.rows;
    if (
        listingImages &&
        listingImages.length > 0 &&
        listingImages[0].logo &&
        listingImages[0].logo.startsWith("admin/")
    ) {
        // await cityListingRepo.deleteListingImage(listingId, cityId);
        await listingImagesRepository.delete({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ],
        });
    } else {
        const imagesToRetain = listingImages.filter((value) =>
            (imageList || []).includes(value.logo)
        );
        const imagesToDelete = listingImages.filter(
            (value) =>
                !imagesToRetain.map((i2r) => i2r.logo).includes(value.logo)
        );

        if (imagesToDelete && imagesToDelete.length > 0) {
            await imageDeleteAsync.deleteMultiple(
                imagesToDelete.map((i) => i.logo)
            );
            // await cityListingRepo.deleteListingImageById(
            //     imagesToDelete.map((i) => i.id),
            //     cityId,
            // );
            await listingImagesRepository.delete({
                filters: [
                    {
                        key: "id",
                        sign: "IN",
                        value: imagesToDelete.map((i) => i.id),
                    },
                ],
            });
        }

        if (imagesToRetain && imagesToRetain.length > 0) {
            for (const imageToRetain of imagesToRetain) {
                // await cityListingRepo.updateListingImage(
                //     imageToRetain.id,
                //     { imageOrder: ++imageOrder },
                //     cityId,
                // );
                await listingImagesRepository.update({
                    data: { imageOrder: ++imageOrder },
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: imageToRetain.id,
                        },
                    ],
                });
            }
        }
        if (imagesToRetain.length === 0 && imageArr.length === 0) {
            await addDefaultImage(listingId, currentListingData.categoryId);
        }
    }

    try {
        for (const individualImage of imageArr) {
            imageOrder++;
            const filePath = `user_${userId}/listing_${listingId}_${imageOrder}_${Date.now()}`;
            const { uploadStatus, objectKey } = await imageUpload(
                individualImage,
                filePath
            );
            if (uploadStatus === "Success") {
                // await cityListingRepo.createListingImage(
                //     cityId,
                //     listingId,
                //     imageOrder,
                //     objectKey,
                // );
                await listingImagesRepository.create({
                    data: {
                        listingId,
                        imageOrder,
                        logo: objectKey,
                    },
                });
            } else {
                throw new AppError("Image Upload failed");
            }
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const uploadPDF = async function (listingId, userId, roleId, pdf) {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    if (
        roleId !== roles.Admin &&
        currentListingData.statusId === status.Approved
    ) {
        throw new AppError(
            `You are not allowed to upload pdf for an approved listing.`,
            403
        );
    }

    if (currentListingData.logo && currentListingData.logo.length > 0) {
        throw new AppError(
            `Image is present in listing So can not upload pdf.`,
            403
        );
    }

    if (!pdf) {
        throw new AppError(`Pdf not uploaded`, 400);
    }

    const arrayOfAllowedFiles = ["pdf"];
    const arrayOfAllowedFileTypes = ["application/pdf"];

    const fileExtension = pdf.name.slice(
        ((pdf.name.lastIndexOf(".") - 1) >>> 0) + 2
    );

    if (
        !arrayOfAllowedFiles.includes(fileExtension) ||
        !arrayOfAllowedFileTypes.includes(pdf.mimetype)
    ) {
        throw new AppError(`Invalid Pdf type`, 403);
    }

    // const imagesToDelete = await cityListingRepo.getListingImages(
    //     listingId,
    //     cityId,
    // );
    const imagesToDeleteResp = await listingImagesRepository.getAll({
        filters: [
            {
                key: "listingId",
                sign: "=",
                value: listingId,
            },
        ],
    });
    const imagesToDelete = imagesToDeleteResp.rows;
    if (imagesToDelete && imagesToDelete.length > 0) {
        await imageDeleteAsync.deleteMultiple(
            imagesToDelete
                .map((i) => i.logo)
                .filter(
                    (i) => typeof i === "string" && i && !i.startsWith("admin/")
                )
        );
        // await cityListingRepo.deleteMultipleListingImagesById(
        //     imagesToDelete.map((i) => i.id),
        //     cityId,
        // );
        await listingImagesRepository.delete({
            filters: [
                {
                    key: "id",
                    sign: "IN",
                    value: imagesToDelete.map((i) => i.id),
                },
            ],
        });
    }

    try {
        const filePath = `user_${userId}/listing_${listingId}_${Date.now()}_PDF.pdf`;
        const { uploadStatus, objectKey } = await pdfUpload(pdf, filePath);
        const pdfUploadStatus = uploadStatus;
        const pdfObjectKey = objectKey;

        const updationData = { pdf: pdfObjectKey };
        const pdfBucketPath =
            "https://" +
            process.env.BUCKET_NAME +
            "." +
            process.env.BUCKET_HOST;

        if (pdfUploadStatus === "Success") {
            // create image
            const pdfFilePath = `${pdfBucketPath}/${filePath}`;
            const imageOrder = 1;
            const imagePath = `user_${userId}/listing_${listingId}_${imageOrder}`;
            const pdfImageBuffer = await getPdfImage(pdfFilePath);
            const { uploadStatus, objectKey } = await imageUpload(
                pdfImageBuffer,
                imagePath
            );

            if (uploadStatus === "Success") {
                await listingImagesRepository.create({
                    data: {
                        listingId,
                        imageOrder,
                        logo: objectKey,
                    },
                });
            }

            await listingRepository.update({
                data: updationData,
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: listingId,
                    },
                ],
            });
        } else {
            throw new AppError("pdf Upload failed");
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteImage = async function (id, userId, roleId) {
    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid ListingsId ${id}`, 404);
    }

    // The current user might not be in the city db
    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: id,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    try {
        // Get images from listing_images table for this listing
        const listingImagesResp = await listingImagesRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ],
        });
        const listingImages = listingImagesResp?.rows || [];

        // Delete each image that does not start with "admin/"
        for (const image of listingImages) {
            if (
                image.logo &&
                typeof image.logo === "string" &&
                !image.logo.startsWith("admin/") &&
                !image.logo.startsWith("https://")
            ) {
                await imageDeleteAsync.deleteImage(image.logo);
            }
        }

        await listingImagesRepository.delete({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ],
        });
        await addDefaultImage(id, currentListingData.categoryId);
    } catch (err) {
        console.log({ err });
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deletePDF = async function (id, userId, roleId) {
    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid ListingsId ${id}`, 404);
    }

    // The current user might not be in the city db
    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: id,
            },
        ],
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    try {
        if (currentListingData.pdf) {
            await imageDeleteAsync.deleteImage(currentListingData.pdf);
        }

        const updationData = {
            pdf: "",
        };

        await listingRepository.update({
            data: updationData,
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ],
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

async function addDefaultImage(listingId, categoryId) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find(
        (key) => categories[key] === +categoryId
    );

    // const categoryCount = await cityListingRepo.getCountByCategory(
    const categoryCountResponse = await listingImagesRepository.getAll({
        filters: [
            {
                key: "logo",
                sign: "LIKE",
                value: `%${categoryName}%`,
            },
        ],
        columns: "COUNT(id) AS count",
    });
    const categoryCount = categoryCountResponse.count;

    const moduloValue = (categoryCount % defaultImageCount[categoryName]) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    return await listingImagesRepository.create({
        data: {
            listingId,
            imageOrder,
            logo: imageName,
        },
    });
}

const vote = async function (listingId, optionId, vote) {
    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    if (!optionId || isNaN(Number(optionId)) || Number(optionId) <= 0) {
        throw new AppError(`Invalid OptionId ${optionId} given`, 400);
    }

    if (isNaN(Number(vote)) || (Number(vote) !== 1 && Number(vote) !== -1)) {
        throw new AppError(`Invalid Vote ${vote} given`, 400);
    }

    const currentCityListing = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: listingId,
            },
        ],
    });
    if (!currentCityListing) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentCityListing.categoryId !== categories.Polls) {
        throw new AppError(`This listing is not a poll`, 400);
    }

    // const pollOptions = await pollRepo.getPollOptions(listingId, cityId);
    const pollOptionsResp = await pollRepository.getAll({
        filters: [
            {
                key: "listingId",
                sign: "=",
                value: listingId,
            },
        ],
    });
    const pollOptions = pollOptionsResp?.rows ?? [];
    if (!pollOptions || pollOptions.length === 0) {
        throw new AppError(`No poll options found for this listing`, 404);
    }
    try {
        const pollOption = pollOptions.find((option) => option.id === optionId);
        if (!pollOption) {
            throw new AppError(`OptionId not found`, 404);
        }

        const voteCount = pollOption.votes + vote;
        if (voteCount < 0) {
            throw new AppError(`Vote count cannot be negative`, 400);
        }

        // await pollRepo.updatePollOptionVotes(optionId, voteCount, cityId);
        await pollRepository.update({
            data: { votes: voteCount },
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: optionId,
                },
            ],
        });
        return voteCount;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getPendingListingsCount = async () => {
    try {
        const response = await listingRepository.getPendingListingsCount();
        return response || 0;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(
            `Error getting pending listings count: ${err.message}`
        );
    }
};

module.exports = {
    getAllListings,
    searchListings,
    createListing,
    deleteListing,
    updateListing,
    getListingWithId,
    updateListingStatus,
    createListingChat,
    handleUnifiedChat,
    getListingChat,
    postChatReaction,
    deleteChatReaction,
    chatUploadImage,
    uploadImage,
    chatUploadPdf,
    uploadPDF,
    deleteImage,
    deletePDF,
    vote,
    getPendingListingsCount,
};
