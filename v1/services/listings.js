const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");
const listingRepo = require("../repository/listings");
const cityRepo = require("../repository/cities");
const statusRepo = require("../repository/status");
const cityListingRepo = require("../repository/cityListing");
const databaseUtil = require("../utils/database");

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
            400,
        );
    }

    if (sortByStartDate) {
        const sortByStartDateString = sortByStartDate.toString();
        if (sortByStartDateString !== "true" && sortByStartDateString !== "false") {
            throw new AppError(
                "The parameter sortByCreatedDate can only be a boolean",
                400,
            );
        } else {
            sortByStartDateBool = sortByStartDateString === "true";
        }
    }

    if (statusId) {
        const response = await cityListingRepo.getStatusById(statusId);
        if (!response) {
            throw new AppError(`Invalid Status '${statusId}' given`, 400);
        }
        filters.push(`L.statusId = ${statusId}`);
    }

    if (categoryId) {
        const category = await cityListingRepo.getCategoryById(categoryId);
        if (!category) {
            throw new AppError(`Invalid Category '${categoryId}' given`, 400);
        }

        if (subcategoryId) {
            const subcategory =
        await cityListingRepo.getSubCategoryById(subcategoryId);
            if (!subcategory) {
                throw new AppError(`Invalid subCategory '${subcategoryId}' given`, 400);
            }
            filters.push(`L.subcategoryId = ${subcategoryId}`);
        }
        filters.push(`L.categoryId = ${categoryId}`);
    }

    if (cityId) {
        const city = await cityRepo.getCityWithId(cityId);
        if (!city) {
            throw new AppError(`Invalid CityId '${cityId}' given`, 400);
        }
        cities = [city];
    } else {
        cities = await cityRepo.getCities();
    }

    if (showExternalListings !== "true") {
        filters.push(`L.sourceId = 1`);
    }

    try {
        const listings = await listingRepo.getCityListingsWithFiltersAndPagination({
            filters,
            pageNo,
            pageSize,
            cities,
            sortByStartDate: sortByStartDateBool,
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
                reqTranslate,
            );
            for (let i = 0; i < noOfListings; i++) {
                if (
                    translations[2 * i].detectedSourceLang !== reqTranslate.slice(0, 2)
                ) {
                    listings[i].titleLanguage = translations[2 * i].detectedSourceLang;
                    listings[i].titleTranslation = translations[2 * i].text;
                }
                if (
                    translations[2 * i + 1].detectedSourceLang !==
          reqTranslate.slice(0, 2)
                ) {
                    listings[i].descriptionLanguage =
            translations[2 * i + 1].detectedSourceLang;
                    listings[i].descriptionTranslation = translations[2 * i + 1].text;
                }
            }
        }
        return listings;
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
            400,
        );
    }

    // Get cities
    if (cityId) {
        const city = await cityRepo.getCityWithId(cityId);
        if (!city) {
            throw new AppError(`Invalid CityId '${cityId}' given`, 400);
        }
        cities = [city];
    } else {
        cities = await cityRepo.getCities();
        if (cities.length === 0) {
            throw new AppError("No cities found", 404);
        }
    }

    // Validate and set sortByStartDate
    if (sortByStartDate) {
        const sortByStartDateString = sortByStartDate.toString();
        if (sortByStartDateString !== "true" && sortByStartDateString !== "false") {
            throw new AppError(
                "The parameter sortByCreatedDate can only be a boolean",
                400,
            );
        }
        sortByStartDateBool = sortByStartDateString === "true";
    }

    // Validate and add status filter
    if (statusId) {
        if (isNaN(Number(statusId)) || Number(statusId) <= 0) {
            throw new AppError(`Invalid status ${statusId}`, 400);
        }
        const status = await statusRepo.getStatusById(statusId);
        if (!status) {
            throw new AppError(`Invalid Status '${statusId}' given`, 400);
        }
        filters.push(`L.statusId = ?`);
    }

    try {
        const listings = await listingRepo.searchListingsWithFilters({
            filters,
            cities,
            searchQuery,
            pageNo,
            pageSize,
            sortByStartDate: sortByStartDateBool,
            statusId,
        });

        // Remove viewCount from listings
        return listings.map((listing) => {
            const { viewCount, ...listingWithoutViewCount } = listing;
            return listingWithoutViewCount;
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error searching listings: ${err.message}`);
    }
};

const createListing = async ({ cityIds, listingData, userId, roleId }) => {
    // Validate cityIds
    if (!cityIds) {
        throw new AppError("CityIds not present", 400);
    }

    if (!Array.isArray(cityIds)) {
        throw new AppError("CityIds should be an array", 400);
    }

    // Validate each cityId
    cityIds.forEach((cityId) => {
        if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            throw new AppError(`Invalid City '${cityId}' given`, 400);
        }
    });

    try {
    // First verify all cities exist
        const transactionMap = {};
        await Promise.all(
            cityIds.map(async (cityId) => {
                const city = await cityRepo.getCityWithId(cityId);
                if (!city) {
                    throw new AppError(`City with id ${cityId} not found`, 404);
                }
                transactionMap[cityId] = await databaseUtil.createTransaction();
            }),
        );

        try {
            const createdListings = await Promise.all(
                cityIds.map((cityId) =>
                    listingRepo.createListingWithTransaction(
                        listingData,
                        transactionMap[cityId],
                    ),
                ),
            );
            Object.values(transactionMap).forEach((trasaction) => {
                databaseUtil.commitTransaction(trasaction);
            });
            return createdListings;
        } catch (error) {
            try {
                Object.values(transactionMap).forEach((trasaction) => {
                    databaseUtil.rollbackTransaction(trasaction);
                });
            } catch (e) {}
            throw new AppError(`Error creating listings: ${error.message}`);
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error creating listing: ${err.message}`);
    }
};

module.exports = {
    getAllListings,
    searchListings,
    createListing,
};
