// const status = require("../constants/status");
// const source = require("../constants/source");
const categories = require("../constants/categories");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate");
// const databaseUtil = require("../utils/database");
// const subcategories = require("../constants/subcategories");
const roles = require("../constants/roles");
// const userRepo = require("../repository/users");
// const cityRepo = require("../repository/cities");
// const cityListingRepo = require("../repository/cityListing");
// const listingRepo = require("../repository/listings");
const deepl = require("deepl-node");
const supportedLanguages = require("../constants/supportedLanguages");
const defaultImageCount = require("../constants/defaultImagesInBucketCount");

// const sendPushNotification = require("../services/sendPushNotification");
// const pollRepo = require("../repository/polls");

const pollRepository = require("../repository/pollOptionsRepo");
// const userRepository = require("../repository/userRepo");
const cityRepository = require("../repository/citiesRepo");
const listingRepository = require("../repository/listingsRepo");
const listingImagesRepository = require("../repository/listingsImagesRepo");
const { createListing } = require("../services/listingFunctions");
const statusRepository = require("../repository/statusRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const userCityuserMappingRepository = require("../repository/userCityuserMappingRepo");
const status = require("../constants/status");

const DEFAULTIMAGE = "Defaultimage";

const createCityListing = async function (
    payload,
    cityId,
    userId,
    roleId,
    // hasDefaultImage,
) {
    try {
        if (!cityId || isNaN(cityId)) {
            throw new AppError(`invalid cityId given`, 400);
        }
        cityId = Number(cityId);

        // refactor
        const response = await createListing([cityId], payload, userId, roleId);
        const listingId = response.find((r) => r.cityId === cityId).listingId;
        return listingId;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getCityListingWithId = async function (
    id,
    cityId,
    repeatedRequest = false,
) {
    try {
        if (!cityId || isNaN(cityId)) {
            throw new AppError(`invalid cityId given`, 400);
        }
        if (isNaN(Number(id)) || Number(id) <= 0) {
            throw new AppError(`Invalid ListingsId ${id}`, 404);
        }
        if (isNaN(Number(id)) || Number(cityId) <= 0) {
            throw new AppError(`City is not present`, 404);
        } else {
            try {
                // const response = await cityRepo.getCityWithId(cityId);
                const response = await cityRepository.getOne({
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: cityId,
                        },
                    ]
                });
                if (!response) {
                    throw new AppError(`Invalid City '${cityId}' given`, 400);
                }
            } catch (err) {
                if (err instanceof AppError) throw err;
                throw new AppError(err);
            }
        }

        // const data = await listingRepo.getCityListingWithId(id, cityId);
        const data = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ],
            cityId,
        });
        if (!data) {
            throw new AppError(`Listings with id ${id} does not exist`, 404);
        }

        const listingImageListResp = await listingImagesRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ],
            cityId,
        });
        const listingImageList = listingImageListResp.rows;
        const logo = listingImageList && listingImageList.length > 0 ? listingImageList[0].logo : null;

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
                cityId,
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
                cityId,
            });
            data.pollOptions = pollOptionResp?.rows ?? [];
        }

        delete data.viewCount;
        return { ...data, logo, otherlogos: listingImageList };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getAllCityListings = async function (params, cityId, isAdmin) {
    const listingFilters = [];
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);

    let listings = [];

    if (!cityId) {
        throw new AppError(`CityId not given`, 400);
    }
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        throw new AppError(`Invalid City '${cityId}' given`, 404);
    } else {
        try {
            const city = await cityRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: cityId,
                    },
                ]
            });
            if (!city) {
                throw new AppError(`Invalid City '${cityId}' given`, 404);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        throw new AppError(`Please enter a positive integer for pageNo`, 400);
    }

    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        throw new AppError(
            `Please enter a positive integer less than or equal to 20 for pageSize`,
            400,
        );
    }

    if (isAdmin && params.statusId) {
        try {
            const status = await statusRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: params.statusId,
                    },
                ],
                cityId,
            });
            if (!status) {
                throw new AppError(`Invalid Status '${params.statusId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        // filters.statusId = params.statusId;
        listingFilters.push({
            key: "statusId",
            sign: "=",
            value: params.statusId,
        });
    } else {
        listingFilters.push({
            key: "statusId",
            sign: "=",
            value: status.Active
        });
    }

    if (params.categoryId) {
        try {
            // const category = await cityListingRepo.getCategoryById(
            //     params.categoryId,
            //     cityId,
            //     true,
            // );
            const category = await categoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: params.categoryId,
                    },
                    {
                        key: "isEnabled",
                        sign: "=",
                        value: true,
                    }
                ],
            })
            if (!category) {
                throw new AppError(
                    `Invalid Category '${params.categoryId}' given`,
                    400,
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        // filters.categoryId = params.categoryId;
        listingFilters.push({
            key: "categoryId",
            sign: "=",
            value: params.categoryId,
        });
    }

    if (params.subcategoryId) {
        if (!params.categoryId) throw new AppError(`categoryId not present`, 400);
        try {
            const subcategory = await categoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: params.subcategoryId,
                    },
                    {
                        key: "categoryId",
                        sign: "=",
                        value: params.categoryId,
                    }
                ],
                cityId,
            });
            if (!subcategory) {
                throw new AppError(
                    `Invalid Sub Category '${params.subcategoryId}' given`,
                    400,
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        // filters.subcategoryId = params.subcategoryId;
        listingFilters.push({
            key: "subcategoryId",
            sign: "=",
            value: params.subcategoryId,
        });
    }

    if (params.userId) {
        try {
            // const user = await userRepo.getCityUserCityMapping(cityId, params.userId);
            const user = await userCityuserMappingRepository.getOne({
                filters: [
                    {
                        key: "cityId",
                        sign: "=",
                        value: cityId,
                    },
                    {
                        key: "userId",
                        sign: "=",
                        value: params.userId,
                    },
                ],
            });
            if (user) {
                // filters.userId = user.cityUserId;
                listingFilters.push({
                    key: "userId",
                    sign: "=",
                    value: user.cityUserId,
                });
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    try {
        // listings = await listingRepo.getAllListingsWithFilters(
        //     filters,
        //     cityId,
        //     pageNo,
        //     pageSize,
        // );
        const response = await listingRepository.getAll({
            filters: listingFilters,
            cityId,
            pageNo,
            pageSize,
        });
        listings = response.rows;
        if (!listings) {
            listings = [];
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }

    const noOfListings = listings.length;
    if (
        noOfListings > 0 &&
        params.translate &&
        supportedLanguages.includes(params.translate)
    ) {
        try {
            const textToTranslate = [];

            listings.forEach((listing) => {
                textToTranslate.push(listing.title);
                textToTranslate.push(listing.description);
            });
            const translations = await translator.translateText(
                textToTranslate,
                null,
                params.translate,
            );

            for (let i = 0; i < noOfListings; i++) {
                if (
                    translations[2 * i].detectedSourceLang !==
                    params.translate.slice(0, 2)
                ) {
                    listings[i].titleLanguage = translations[2 * i].detectedSourceLang;
                    listings[i].titleTranslation = translations[2 * i].text;
                }
                if (
                    translations[2 * i + 1].detectedSourceLang !==
                    params.translate.slice(0, 2)
                ) {
                    listings[i].descriptionLanguage =
                        translations[2 * i + 1].detectedSourceLang;
                    listings[i].descriptionTranslation = translations[2 * i + 1].text;
                }
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    return listings;
};

const updateCityListing = async function (id, cityId, payload, userId, roleId) {
    const updationData = {};

    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid ListingsId ${id}`, 404);
    }

    const response = await userCityuserMappingRepository.getOne({
        filters: [
            {
                key: "cityId",
                sign: "=",
                value: cityId,
            },
            {
                key: "userId",
                sign: "=",
                value: userId,
            },
        ],
    });
    const cityUserId = response ? response.cityUserId : null;

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: id,
            },
        ],
        cityId,
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }
    let subcategory = false;
    updationData.updatedAt = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    if (payload.categoryId) {
        try {
            const data = await categoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: payload.categoryId,
                    },
                ],
                cityId,
            });
            if (!data) {
                throw new AppError(
                    `Invalid Category '${payload.categoryId}' given`,
                    400,
                );
            }
            if (data.noOfSubcategories > 0) {
                subcategory = true;
            } else {
                updationData.subcategoryId = null;
                delete payload.subcategoryId;
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        updationData.categoryId = payload.categoryId;
        try {
            if (
                parseInt(payload.categoryId) === categories.News &&
                !payload.timeless
            ) {
                if (payload.expiryDate) {
                    updationData.expiryDate = getDateInFormate(
                        new Date(payload.expiryDate),
                    );
                } else {
                    updationData.expiryDate = getDateInFormate(
                        new Date(
                            new Date(updationData.updatedAt).getTime() +
                            1000 * 60 * 60 * 24 * 14,
                        ),
                    );
                }
            } else if (parseInt(payload.categoryId) === categories.Events) {
                if (payload.startDate) {
                    updationData.startDate = getDateInFormate(
                        new Date(payload.startDate),
                    );
                } else {
                    throw new AppError(`Start date is not present`, 400);
                }
                if (payload.endDate) {
                    updationData.endDate = getDateInFormate(new Date(payload.endDate));
                    updationData.expiryDate = getDateInFormate(
                        new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24),
                    );
                } else {
                    updationData.expiryDate = getDateInFormate(
                        new Date(
                            new Date(payload.startDate).getTime() + 1000 * 60 * 60 * 24,
                        ),
                    );
                }
            } else {
                updationData.expiryDate = null;
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Invalid time format ${error}`, 400);
        }
        try {
            // const response = await listingRepo.getCityListingImage(id, cityId);
            const response = await listingImagesRepository.getAll({
                filters: [
                    {
                        key: "listingId",
                        sign: "=",
                        value: id,
                    },
                ],
                cityId,
            });
            const hasDefaultImage = response?.rows?.length === 1 && response.rows[0].logo.startsWith("admin");

            if (hasDefaultImage) {
                await listingImagesRepository.delete({
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: response.rows[0].id,
                        },
                    ],
                    cityId,
                });
                await addDefaultImage(cityId, id, payload.categoryId);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
    if (payload.subcategoryId) {
        if (!subcategory) {
            throw new AppError(
                `Invalid Sub Category. Category Id = '${payload.categoryId}' doesn't have a subcategory.`,
                400,
            );
        }
        try {
            const subcategory = await categoriesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: payload.subcategoryId,
                    },
                    {
                        key: "categoryId",
                        sign: "=",
                        value: payload.categoryId,
                    }
                ],
                cityId,
            });
            if (!subcategory) {
                throw new AppError(
                    `Invalid Sub Category '${payload.subcategoryId}' given`,
                    400,
                );
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        updationData.subcategoryId = payload.subcategoryId;
    }

    if (currentListingData.userId !== cityUserId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    if (payload.title) {
        if (payload.title.length > 255) {
            throw new AppError(`Length of Title cannot exceed 255 characters`, 400);
        }
        updationData.title = payload.title;
    }
    if (payload.place) {
        updationData.place = payload.place;
    }
    if (payload.description) {
        if (payload.description.length > 65535) {
            throw new AppError(
                `Length of Description cannot exceed 65535 characters`,
                400,
            );
        }
        updationData.description = payload.description;
    }

    if (payload.media) {
        updationData.media = payload.media;
    }
    if (payload.address) {
        updationData.address = payload.address;
    }

    if (payload.email && payload.email !== currentListingData.email) {
        const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(payload.email)) {
            throw new AppError(`Invalid email given`, 400);
        }
        updationData.email = payload.email;
    }

    if (payload.phone && payload.phone !== currentListingData.phone) {
        const re = /^[+][(]{0,1}[0-9]{1,3}[)]{0,1}[-\s./0-9]$/g;
        if (!re.test(payload.phone)) {
            throw new AppError(`Invalid Phone number given`, 400);
        }
        updationData.phone = payload.phone;
    }

    if (payload.website) {
        updationData.website = payload.website;
    }
    if (payload.price) {
        updationData.price = payload.price;
    }
    if (payload.discountPrice) {
        updationData.discountPrice = payload.discountPrice;
    }
    if (payload.zipcode) {
        updationData.zipcode = payload.zipcode;
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

    if (
        payload.statusId &&
        payload.statusId !== currentListingData.statusId &&
        roleId === roles.Admin
    ) {
        try {
            const status = await statusRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: payload.statusId,
                    },
                ],
                cityId,
            });
            if (!status) {
                throw new AppError(`Invalid Status '${payload.statusId}' given`, 400);
            }
            updationData.statusId = payload.statusId;
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }
    if (payload.longitude) {
        updationData.longitude = payload.longitude;
    }
    if (payload.latitude) {
        updationData.latitude = payload.latitude;
    }

    try {
        await listingRepository.update({
            data: updationData,
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ],
            cityId,
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

async function addDefaultImage(cityId, listingId, categoryId) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find(
        (key) => categories[key] === +categoryId,
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
        cityId,
        columns: "COUNT(id) AS count",
    });
    const categoryCount = categoryCountResponse.count;

    const moduloValue = (categoryCount % defaultImageCount[categoryName]) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    // Create listing image
    // return await cityListingRepo.createListingImage(
    //     cityId,
    //     listingId,
    //     imageOrder,
    //     imageName,
    // );
    return await listingImagesRepository.create({
        data: {
            listingId,
            imageOrder,
            logo: imageName,
        },
        cityId,
    });
}

async function addDefaultImageWithTransaction(
    cityId,
    listingId,
    categoryId,
    transaction,
) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find(
        (key) => categories[key] === +categoryId,
    );

    const categoryCountResponse = await listingImagesRepository.getCount({
        filters: [
            {
                key: "logo",
                sign: "LIKE",
                value: `%${categoryName}%`,
            },
        ],
        cityId,
        columns: "COUNT(id) AS count",
    });
    const categoryCount = categoryCountResponse.count;
    const moduloValue = (categoryCount % defaultImageCount[categoryName]) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    // Create listing image
    return await listingImagesRepository.create({
        data: {
            listingId,
            imageOrder,
            logo: imageName,
        },
        cityId,
        transaction,
    });
}

module.exports = {
    createCityListing,
    getCityListingWithId,
    getAllCityListings,
    updateCityListing,
    addDefaultImageWithTransaction,
};
