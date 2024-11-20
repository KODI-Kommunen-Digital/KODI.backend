// const status = require("../constants/status");
// const source = require("../constants/source");
const categories = require("../constants/categories");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate");
// const databaseUtil = require("../utils/database");
// const subcategories = require("../constants/subcategories");
const roles = require("../constants/roles");
const userRepo = require("../repository/users");
const cityRepo = require("../repository/cities");
const cityListingRepo = require("../repository/cityListing");
const listingRepo = require("../repository/listings");
const imageUpload = require("../utils/imageUpload");
const getPdfImage = require("../utils/getPdfImage");
const pdfUpload = require("../utils/pdfUpload");
const objectDelete = require("../utils/imageDelete");
const deepl = require("deepl-node");
const supportedLanguages = require("../constants/supportedLanguages");
const defaultImageCount = require("../constants/defaultImagesInBucketCount");
const bucketClient = require("../utils/bucketClient");
const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const axios = require("axios");
const parser = require("xml-js");

// const sendPushNotification = require("../services/sendPushNotification");
const pollRepo = require("../repository/polls");

const pollRepository = require("../repository/pollOptionsRepo");
// const userRepository = require("../repository/userRepo");
const cityRepository = require("../repository/citiesRepo");
const listingRepository = require("../repository/listingsRepo");
const listingImagesRepository = require("../repository/listingsImagesRepo");
const { createListing } = require("../services/listingFunctions");
const statusRepository = require("../repository/statusRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const userCityuserMappingRepo = require("../repository/userCityuserMappingRepo");

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

        const listingImageList = await listingRepo.getCityListingImage(id, cityId);
        const logo = listingImageList ? listingImageList[0].logo : null;

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

const getAllCityListings = async function (params, cityId) {
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

    if (params.statusId) {
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
            const user = await userCityuserMappingRepo.getOne({
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
            listingFilters,
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

    const response = await userCityuserMappingRepo.getOne({
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

    const currentListingData = await listingRepo.getCityListingWithId(id, cityId);
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

const uploadImageForCityListing = async function (
    listingId,
    cityId,
    userId,
    roleId,
    files,
) {
    if (!cityId) {
        throw new AppError(`City is not present`, 404);
    } else {
        try {
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
                throw new AppError(`City '${cityId}' not found`, 404);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const response = await userCityuserMappingRepo.getOne({
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
                value: listingId,
            },
        ],
        cityId,
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentListingData.userId !== cityUserId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    if (currentListingData.pdf && currentListingData.pdf.length > 0) {
        throw new AppError(
            `Pdf is present in listing So can not upload image.`,
            403,
        );
    }

    const image = files?.image;
    const imageArr = image ? (image.length > 1 ? image : [image]) : [];
    const hasIncorrectMime = imageArr.some((i) => !i.mimetype.includes("image/"));
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
        cityId,
    });
    const listingImages = listingImagesResp.rows;
    if (listingImages[0].logo.startsWith("admin/")) {
        // await cityListingRepo.deleteListingImage(listingId, cityId);
        await listingImagesRepository.delete({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ],
            cityId,
        });
    } else {
        const imagesToRetain = listingImages.filter((value) =>
            (image || []).includes(value.logo),
        );
        const imagesToDelete = listingImages.filter(
            (value) => !imagesToRetain.map((i2r) => i2r.logo).includes(value.logo),
        );

        if (imagesToDelete && imagesToDelete.length > 0) {
            await imageDeleteAsync.deleteMultiple(imagesToDelete.map((i) => i.logo));
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
                cityId,
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
                    cityId,
                });
            }
        }
        if (imagesToRetain.length === 0 && imageArr.length === 0) {
            await addDefaultImage(cityId, listingId, currentListingData.categoryId);
        }
    }

    try {
        for (const individualImage of imageArr) {
            imageOrder++;
            const filePath = `user_${userId}/city_${cityId}_listing_${listingId}_${imageOrder}_${Date.now()}`;
            const { uploadStatus, objectKey } = await imageUpload(
                individualImage,
                filePath,
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
                    cityId,
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

const vote = async function (listingId, cityId, optionId, vote) {
    if (!cityId || isNaN(Number(cityId)) || Number(cityId) <= 0) {
        throw new AppError(`City is not present`, 404);
    } else {
        const city = await cityRepo.getCityWithId(cityId);
        if (!city) {
            throw new AppError(`City '${cityId}' not found`, 404);
        }
    }

    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    if (!optionId || isNaN(Number(optionId)) || Number(optionId) <= 0) {
        throw new AppError(`Invalid OptionId ${optionId} given`, 400);
    }

    if (isNaN(Number(vote)) || (Number(vote) !== 1 && Number(vote) !== -1)) {
        throw new AppError(`Invalid Vote ${vote} given`, 400);
    }

    const currentCityListing = await listingRepo.getCityListingWithId(
        listingId,
        cityId,
    );
    if (!currentCityListing) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentCityListing.categoryId !== categories.Polls) {
        throw new AppError(`This listing is not a poll`, 400);
    }

    const pollOptions = await pollRepo.getPollOptions(listingId, cityId);
    if (!pollOptions || pollOptions.length === 0) {
        throw new AppError(`No poll options found for this listing`, 404);
    }
    try {
        const pollOption = pollOptions.rows.find(
            (option) => option.id === optionId,
        );
        if (!pollOption) {
            throw new AppError(`OptionId not found`, 404);
        }

        const voteCount = pollOption.votes + vote;
        if (voteCount < 0) {
            throw new AppError(`Vote count cannot be negative`, 400);
        }

        await pollRepo.updatePollOptionVotes(optionId, voteCount, cityId);
        return voteCount;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const uploadPDFForCityListing = async function (
    listingId,
    cityId,
    userId,
    roleId,
    pdf,
) {
    if (!cityId) {
        throw new AppError(`City is not present`, 404);
    } else {
        try {
            const response = await cityRepo.getCityWithId(cityId);
            if (!response) {
                throw new AppError(`City '${cityId}' not found`, 404);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        throw new AppError(`Invalid ListingsId ${listingId} given`, 400);
    }

    const response = await userRepo.getCityUserCityMapping(cityId, userId);
    const cityUserId = response ? response.cityUserId : null;

    const currentListingData = await listingRepo.getCityListingWithId(
        listingId,
        cityId,
    );
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentListingData.userId !== cityUserId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (currentListingData.logo && currentListingData.logo.length > 0) {
        throw new AppError(
            `Image is present in listing So can not upload pdf.`,
            403,
        );
    }

    if (!pdf) {
        throw new AppError(`Pdf not uploaded`, 400);
    }

    const arrayOfAllowedFiles = ["pdf"];
    const arrayOfAllowedFileTypes = ["application/pdf"];

    const fileExtension = pdf.name.slice(
        ((pdf.name.lastIndexOf(".") - 1) >>> 0) + 2,
    );

    if (
        !arrayOfAllowedFiles.includes(fileExtension) ||
        !arrayOfAllowedFileTypes.includes(pdf.mimetype)
    ) {
        throw new AppError(`Invalid Pdf type`, 403);
    }

    const imagesToDelete = await cityListingRepo.getListingImages(
        listingId,
        cityId,
    );
    if (imagesToDelete && imagesToDelete.length > 0) {
        await imageDeleteAsync.deleteMultiple(
            imagesToDelete.map((i) => i.logo).filter((i) => !i.startsWith("admin/")),
        );
        await cityListingRepo.deleteMultipleListingImagesById(
            imagesToDelete.map((i) => i.id),
            cityId,
        );
    }

    try {
        const filePath = `user_${userId}/city_${cityId}_listing_${listingId}_${Date.now()}_PDF.pdf`;
        const { uploadStatus, objectKey } = await pdfUpload(pdf, filePath);
        const pdfUploadStatus = uploadStatus;
        const pdfObjectKey = objectKey;

        const updationData = { pdf: pdfObjectKey };
        const pdfBucketPath =
            "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST;

        if (pdfUploadStatus === "Success") {
            // create image
            const pdfFilePath = `${pdfBucketPath}/${filePath}`;
            const imageOrder = 1;
            const imagePath = `user_${userId}/city_${cityId}_listing_${listingId}_${imageOrder}`;
            const pdfImageBuffer = await getPdfImage(pdfFilePath);
            const { uploadStatus, objectKey } = await imageUpload(
                pdfImageBuffer,
                imagePath,
            );

            if (uploadStatus === "Success") {
                // update logo
                await cityListingRepo.createListingImage(
                    cityId,
                    listingId,
                    imageOrder,
                    objectKey,
                );
            }

            await cityListingRepo.updateCityListing(listingId, updationData, cityId);
        } else {
            throw new AppError("pdf Upload failed");
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteImageForCityListing = async function (id, cityId, userId, roleId) {
    if (!cityId) {
        throw new AppError(`City is not present`, 404);
    } else {
        try {
            const response = await cityRepo.getCityWithId(cityId);
            if (!response) {
                throw new AppError(`City '${cityId}' not found`, 404);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid ListingsId ${id}`, 404);
    }

    const response = await userRepo.getCityUserCityMapping(cityId, userId);

    // The current user might not be in the city db
    const cityUserId = response ? response.cityUserId : null;
    const currentListingData = await listingRepo.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== cityUserId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    // todo: move this to a separate layer
    let imageList = await axios.get(
        "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST,
    );
    imageList = JSON.parse(
        parser.xml2json(imageList.data, { compact: true, spaces: 4 }),
    );
    const userImageList = imageList.ListBucketResult.Contents.filter((obj) =>
        obj.Key._text.includes(`user_${userId}/city_${cityId}_listing_${id}`),
    );

    try {
        const onSucccess = async () => {
            await cityListingRepo.deleteListingImage(id, cityId);
            await addDefaultImage(cityId, id, currentListingData.categoryId);
        };
        const onFail = (err) => {
            throw new AppError("Image Delete failed with Error Code: " + err);
        };

        await imageDeleteMultiple(
            userImageList.map((image) => ({ Key: image.Key._text })),
            onSucccess,
            onFail,
        );
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deletePDFForCityListing = async function (id, cityId, userId, roleId) {
    if (!cityId) {
        throw new AppError(`City is not present`, 404);
    } else {
        try {
            const response = await cityRepo.getCityWithId(cityId);
            if (!response) {
                throw new AppError(`City '${cityId}' not found`, 404);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid ListingsId ${id}`, 404);
    }

    const response = await userRepo.getCityUserCityMapping(cityId, userId);

    // The current user might not be in the city db
    const cityUserId = response ? response.cityUserId : null;
    const currentListingData = await listingRepo.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== cityUserId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    try {
        const onSucccess = async () => {
            const updationData = {};
            updationData.pdf = "";

            await cityListingRepo.updateCityListing(id, updationData, cityId);
        };
        const onFail = (err) => {
            throw new AppError("Pdf Delete failed with Error Code: " + err);
        };
        await objectDelete(
            `user_${userId}/city_${cityId}_listing_${id}_PDF.pdf`,
            onSucccess,
            onFail,
        );
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const deleteCityListing = async function (id, cityId, userId, roleId) {
    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }
    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid entry ${id}`, 404);
    }

    const cityResp = await cityRepo.getCityWithId(cityId);
    if (!cityResp) {
        throw new AppError(`City '${cityId}' not found`, 404);
    }

    const currentListingData = await listingRepo.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    const userImageList = await bucketClient.fetchUserImages(userId, cityId, id);

    const response = await userRepo.getCityUserCityMapping(cityId, userId);
    const cityUserId = response ? response.cityUserId : null;
    if (currentListingData.userId !== cityUserId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    const onSucccess = async () => {
        // TODO : use transactions
        await cityListingRepo.deleteListingImage(id, cityId);
        await cityListingRepo.deleteCityListing(id, cityId);
    };
    const onFail = (err) => {
        throw new AppError("Image Delete failed with Error Code: " + err);
    };

    await imageDeleteMultiple(
        userImageList.map((image) => ({ Key: image.Key._text })),
        onSucccess,
        onFail,
    );
};

async function addDefaultImage(cityId, listingId, categoryId) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find(
        (key) => categories[key] === +categoryId,
    );

    // const categoryCount = await cityListingRepo.getCountByCategory(
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

    const categoryCount = await cityListingRepo.getCountByCategory(
        cityId,
        categoryName,
    );
    const moduloValue = (categoryCount % defaultImageCount[categoryName]) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    // Create listing image
    return await cityListingRepo.createListingImageWithTransaction(
        listingId,
        imageOrder,
        imageName,
        transaction,
    );
}

module.exports = {
    createCityListing,
    getCityListingWithId,
    getAllCityListings,
    updateCityListing,
    uploadImageForCityListing,
    uploadPDFForCityListing,
    deleteImageForCityListing,
    deletePDFForCityListing,
    deleteCityListing,
    addDefaultImageWithTransaction,
    vote,
};
