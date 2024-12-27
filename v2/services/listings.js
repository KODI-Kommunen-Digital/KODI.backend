const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");

const listingRepository = require("../repository/listingsRepo");
const cityRepository = require("../repository/citiesRepo");
const statusRepository = require("../repository/statusRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const subcategoriesRepository = require("../repository/subcategoriesRepo");
const listingFunctions = require("../services/listingFunctions");
const status = require("../constants/status");
const source = require("../constants/source");

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
    isAdmin
}) => {
    const filters = {};
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

    if (isAdmin && statusId) {
        // const response = await cityListingRepo.getStatusById(statusId);
        const response = await statusRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: statusId
                }
            ]
        }); // removing the cityId
        if (!response || !response.rows || !response.rows.length) {
            throw new AppError(`Invalid Status '${statusId}' given`, 400);
        }
        filters.statusId = statusId;
    } else {
        filters.statusId = status.Active;
    }

    if (categoryId) {
        // const category = await cityListingRepo.getCategoryById(categoryId);
        const categoryResp = await categoriesRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: categoryId
                }
            ]
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
                            value: subcategoryId
                        }
                    ]
                });
            // if (!subcategory) {
            if (!subcategory || !subcategory.rows || !subcategory.rows.length) {
                throw new AppError(`Invalid subCategory '${subcategoryId}' given`, 400);
            }
            filters.subcategoryId = subcategoryId;
        }
        filters.categoryId = categoryId;
    }

    if (cityId) {
        // const city = await cityRepo.getCityWithId(cityId);
        // Validate the cityId input to ensure it only contains integers separated by commas
        if (!/^\d+(,\d+)*$/.test(cityId)) {
            throw new AppError(`Invalid format for CityId '${cityId}'. Please provide a comma-separated list of integers.`, 400);
        }

        // Parse the cityId string to an array of integers
        const cityIds = cityId.split(',').map(id => parseInt(id.trim(), 10));

        // Retrieve cities using the parsed array of IDs
        const citiesResp = await cityRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "IN",
                    value: cityIds
                }
            ]
        });

        // Throw an error if no cities are found
        if (!citiesResp.length) {
            throw new AppError(`No cities found for provided CityId(s) '${cityId}'`, 400);
        }

        // Check if the number of cities retrieved matches the number of IDs provided
        if (citiesResp.length !== cityIds.length) {
            // Find missing IDs by filtering out those that were found in the database
            const foundIds = citiesResp.map(city => city.id);
            const missingIds = cityIds.filter(id => !foundIds.includes(id));
            throw new AppError(`The following CityId(s) are invalid: ${missingIds.join(', ')}`, 404);
        }
        cities = cityIds;
    } else {
        // cities = await cityRepo.getCities();
        const citiesResp = await cityRepository.getAll({
            columns: "id,name,image, hasForum",
            sort: ["name"]
        });
        cities = citiesResp?.rows ?? [];
    }

    if (showExternalListings !== "true") {
        filters.sourceId = source.UserEntry;
    }

    try {
        const listings = await listingRepository.retrieveListings({
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
    isAdmin
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
        // const city = await cityRepo.getCityWithId(cityId);
        const city = await cityRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: cityId
                }
            ]
        });
        if (!city) {
            throw new AppError(`Invalid CityId '${cityId}' given`, 400);
        }
        cities = [city];
    } else {
        // cities = await cityRepo.getCities();
        const citiesResp = await cityRepository.getAll({
            columns: "id,name,image, hasForum",
            sort: ["name"]
        });
        cities = citiesResp?.rows ?? [];
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
    if (isAdmin && statusId) {
        if (isNaN(Number(statusId)) || Number(statusId) <= 0) {
            throw new AppError(`Invalid status ${statusId}`, 400);
        }
        // const status = await statusRepo.getStatusById(statusId);
        const status = await statusRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: statusId
                }
            ]
        });
        if (!status) {
            throw new AppError(`Invalid Status '${statusId}' given`, 400);
        }
        filters.statusId = statusId;
    } else {
        filters.statusId = status.Active;
    }

    try {
        const listings = await listingRepository.retrieveListings({
            filters,
            cities,
            searchQuery,
            pageNo,
            pageSize,
            sortByStartDate: sortByStartDateBool
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

    try {
        const createdListings = await listingFunctions.createListing(cityIds, listingData, userId, roleId)
        return createdListings;
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
