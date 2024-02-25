const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");
const listingRepo = require("../repository/listings");
const cityRepo = require("../repository/cities");
const cityListingRepo = require("../repository/cityListing");

const getAllListings = async function (pageNo, pageSize, reqSortByStartDate, reqStatusId, reqSubcategoryId, reqCategoryId, reqCityId, reqTranslate, reqShowExternalListings) {
    const filters = [];
    let sortByStartDate = false;
    let cities = [];

    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        throw new AppError(`Please enter a positive integer for pageNo`, 400)

    }
    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        throw new AppError(
            `Please enter a positive integer less than or equal to 20 for pageSize`,
            400
        );

    }

    if (reqSortByStartDate) {
        const sortByStartDateString = reqSortByStartDate.toString()
        if (sortByStartDateString !== 'true' && sortByStartDateString !== 'false') {
            throw new AppError(`The parameter sortByCreatedDate can only be a boolean`, 400)

        } else {
            sortByStartDate = sortByStartDateString === 'true';
        }
    }

    if (reqStatusId) {
        try {
            const response = await cityListingRepo.getStatusById(reqStatusId);
            if (!response) {
                throw new AppError(`Invalid Status '${reqStatusId}' given`, 400)

            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.push(`L.statusId = ${reqStatusId} `);
    }

    if (reqCategoryId) {
        try {
            const data = await cityListingRepo.getCategoryById(reqCategoryId);
            if (!data) {
                throw new AppError(`Invalid Category '${reqCategoryId}' given`, 400);

            } else {
                if (reqSubcategoryId) {
                    try {
                        const data = await cityListingRepo.getSubCategoryById(reqSubcategoryId);
                        if (!data) {
                            throw new AppError(`Invalid subCategory '${reqSubcategoryId}' given`, 400);
                        }
                    } catch (err) {
                        if (err instanceof AppError) throw err;
                        throw new AppError(err);
                    }
                    filters.push(`L.subcategoryId = ${reqSubcategoryId} `);
                }
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.push(`L.categoryId = ${reqCategoryId} `);
    }

    try {
        if (reqCityId) {
            const response = await cityRepo.getCityWithId(reqCityId);
            if (!response) {
                throw new AppError(`Invalid CityId '${reqCityId}' given`, 400);

            }
            cities = [response];
        } else {
            cities = await cityRepo.getCities();

        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
    if (reqShowExternalListings !== 'true') {
        filters.push(`L.sourceId = 1 `);
    }

    try {
        const listings = await listingRepo.getCityListingsWithFiltersAndPagination(filters, pageNo, pageSize, cities, sortByStartDate)
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

module.exports = {
    getAllListings,
};