const status = require("../constants/status");
const source = require("../constants/source");
const categories = require("../constants/categories");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate")
const databaseUtil = require("../utils/database");
const subcategories = require("../constants/subcategories");
const roles = require("../constants/roles");
const userRepo = require("../repository/users");
const cityRepo = require("../repository/cities");
const cityListingRepo = require("../repository/cityListing");
const listingRepo = require("../repository/listings");
const imageUpload = require("../utils/imageUpload");
const getPdfImage = require("../utils/getPdfImage");
const pdfUpload = require("../utils/pdfUpload")
const objectDelete = require("../utils/imageDelete");
const deepl = require("deepl-node");
const supportedLanguages = require("../constants/supportedLanguages");
const defaultImageCount = require("../constants/defaultImagesInBucketCount");
const bucketClient = require("../utils/bucketClient");
const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const sendPushNotification = require("../services/sendPushNotification");


const DEFAULTIMAGE = "Defaultimage";

const createCityListing = async function (payload, cityId, userId, roleId, hasDefaultImage) {
    try {
        const insertionData = {};
        let user = {};
        let city = {};

        if (!payload) {
            throw new AppError(`Empty payload sent`, 400);
        }
        if (!cityId) {
            throw new AppError(`City is not present`, 404);
        }

        city = await cityRepo.getCityWithId(cityId);
        if (!city) {
            throw new AppError(`Invalid City '${cityId}' given`, 400);
        }

        user = await userRepo.getUserById(userId);
        if (!user) {
            throw new AppError(`Invalid User '${userId}' given`, 400);
        }

        if (
            typeof parseInt(payload.villageId) === "number" &&
            parseInt(payload.villageId) !== 0
        ) {
            const village = await cityListingRepo.getVillageById(
                payload.villageId,
                cityId
            );
            if (!village) {
                throw new AppError(`Invalid Village id '${payload.villageId}' given`, 400);
            }
            insertionData.villageId = village.id;
        } else {
            insertionData.villageId = null;
        }

        if (!payload.title) {
            throw new AppError(`Title is not present`, 400);
        } else if (payload.title.length > 255) {
            throw new AppError(`Length of Title cannot exceed 255 characters`, 400);
        } else {
            insertionData.title = payload.title;
        }

        if (!payload.place) {
            insertionData.place = payload.place;
        }

        if (!payload.description) {
            throw new AppError(`Description is not present`, 400);
        } else if (payload.description.length > 65535) {
            throw new AppError(`Length of Description cannot exceed 65535 characters`, 400);
        } else {
            insertionData.description = payload.description;
        }

        if (payload.media) {
            insertionData.media = payload.media;
        }

        let subcategory = false;
        if (!payload.categoryId) {
            throw new AppError(`Category is not present`, 400);
        } else {
            const category = await cityListingRepo.getCategoryById(payload.categoryId, cityId);
            if (!category) {
                throw new AppError(`Invalid Category '${payload.categoryId}' given`, 400);
            }
            insertionData.categoryId = payload.categoryId;
            if (category.noOfSubcategories > 0) subcategory = true;
        }

        if (payload.subcategoryId) {
            if (!subcategory) {
                throw new AppError(
                    `Invalid Sub Category. Category Id = '${payload.categoryId}' doesn't have a subcategory.`,
                    400
                );
            }
            const subcategoryData = await cityListingRepo.getSubCategoryById(payload.subcategoryId, cityId);
            if (!subcategoryData) {
                throw new AppError(`Invalid Sub Category '${payload.subcategoryId}' given`, 400);
            }
            insertionData.subcategoryId = payload.subcategoryId;
        }

        if (!payload.statusId) {
            insertionData.statusId = status.Pending;
        } else {
            if (roleId !== roles.Admin) {
                insertionData.statusId = status.Pending;
            } else {
                const status = await cityListingRepo.getStatusById(payload.statusId, cityId);
                if (!status) {
                    throw new AppError(`Invalid Status '${payload.statusId}' given`, 400);
                }
                insertionData.statusId = payload.statusId;
            }
        }

        insertionData.sourceId = source.UserEntry;

        if (payload.address) {
            insertionData.address = payload.address;
        }

        if (payload.email) {
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!regex.test(payload.email)) {
                throw new AppError(`Invalid email Id given`, 400);
            }
            insertionData.email = payload.email;
        }

        if (payload.phone) {
            const re = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
            if (!re.test(payload.phone)) {
                throw new AppError(`Invalid Phone number given`, 400);
            }
            insertionData.phone = payload.phone;
        }

        if (payload.website) {
            insertionData.website = payload.website;
        }

        if (payload.price) {
            insertionData.price = payload.price;
        }

        if (payload.discountPrice) {
            insertionData.discountPrice = payload.discountPrice;
        }
        if (payload.logo) {
            insertionData.logo = payload.logo;
        }

        if (payload.longitude) {
            insertionData.longitude = payload.longitude;
        }

        if (payload.latitude) {
            insertionData.latitude = payload.latitude;
        }

        if (payload.zipcode) {
            insertionData.zipcode = payload.zipcode;
        }
        insertionData.createdAt = getDateInFormate(new Date());
        try {
            if (parseInt(payload.categoryId) === categories.News && !payload.timeless) {
                if (payload.expiryDate) {
                    insertionData.expiryDate = payload.expiryDate;
                } else {
                    insertionData.expiryDate = getDateInFormate(
                        new Date(
                            new Date(insertionData.createdAt).getTime() + 1000 * 60 * 60 * 24 * 14
                        )
                    );
                }
            }
            if (parseInt(payload.categoryId) === categories.Events) {
                if (payload.startDate) {
                    insertionData.startDate = getDateInFormate(new Date(payload.startDate));
                } else {
                    throw new AppError(`Start date is not present`, 400);
                }

                if (payload.endDate) {
                    insertionData.endDate = getDateInFormate(new Date(payload.endDate));
                    insertionData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
                } else {
                    insertionData.expiryDate = getDateInFormate(new Date(new Date(payload.startDate).getTime() + 1000 * 60 * 60 * 24));
                }
            }
            insertionData.createdAt = getDateInFormate(new Date());
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(`Invalid time format ${err}`, 400);
        }

        const transaction = await databaseUtil.createTransaction(cityId);
        const heidiTransaction = await databaseUtil.createTransaction(); // for root database
        try {
            let response = {};
            const userId = user.id;
            if (city.isAdminListings) {
                // If the city is admin listings, we need directly set the user id of the listing as 1 (i.e. admin's id)
                insertionData.userId = 1;
            } else {
                response = await cityListingRepo.getCityUserMapping(cityId, userId);
                if (!response) {
                    delete user.id;
                    delete user.password;
                    delete user.socialMedia;
                    delete user.emailVerified;

                    response = await userRepo.createCityUserWithTransaction(user, transaction);

                    const cityUserId = response.id;
                    await cityRepo.createCityUserCityMappingWithTransaction(cityId, userId, cityUserId, heidiTransaction);
                    insertionData.userId = cityUserId;
                } else {
                    insertionData.userId = response.cityUserId;
                }
            }
            response = await listingRepo.createListingWithTransaction(insertionData, transaction);
            const listingId = response.id;
            await listingRepo.createUserListingMappingWithTransaction(cityId, userId, listingId, heidiTransaction);
            if (hasDefaultImage) {
                await addDefaultImageWithTransaction(cityId, listingId, payload.categoryId, transaction);
            }

            if (parseInt(insertionData.categoryId) === categories.News &&
                parseInt(insertionData.subcategoryId) === subcategories.newsflash &&
                insertionData.statusId === status.Active &&
                roleId === roles.Admin) {
                await sendPushNotification.sendPushNotificationToAll("warnings", "Eilmeldung",
                    insertionData.title,
                    { cityId: cityId.toString(), "id": listingId.toString() }
                )
            }
            // commit both the transactions together to ensure atomicity
            await databaseUtil.commitTransaction(transaction);
            await databaseUtil.commitTransaction(heidiTransaction);

            return listingId;
        } catch (err) {
            await databaseUtil.rollbackTransaction(transaction);
            await databaseUtil.rollbackTransaction(heidiTransaction);
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const getCityListingWithId = async function (id, cityId) {
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
                const response = await cityRepo.getCityWithId(cityId);
                if (!response) {
                    throw new AppError(`Invalid City '${cityId}' given`, 400);
                }
            } catch (err) {
                if (err instanceof AppError) throw err;
                throw new AppError(err);
            }
        }

        const data = await listingRepo.getCityListingWithId(id, cityId);
        if (!data) {
            throw new AppError(`Listings with id ${id} does not exist`, 404);
        }

        const listingImageList = await listingRepo.getCityListingImage(id, cityId);
        const logo = listingImageList ? listingImageList[0].logo : null;

        return { ...data, logo, otherlogos: listingImageList };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const getAllCityListings = async function (params, cityId) {
    const filters = {};
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);

    let listings = [];

    if (!cityId) {
        throw new AppError(`CityId not given`, 400);
    }
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        throw new AppError(`Invalid City '${cityId}' given`, 404);
    } else {
        try {
            const city = await cityRepo.getCityWithId(cityId);
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
            400
        );

    }

    if (params.statusId) {
        try {
            const status = await cityListingRepo.getStatusById(params.statusId, cityId);
            if (!status) {
                throw new AppError(`Invalid Status '${params.statusId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.statusId = params.statusId;
    }

    if (params.categoryId) {
        try {
            const category = await cityListingRepo.getCategoryById(params.categoryId, cityId);
            if (!category) {
                throw new AppError(`Invalid Category '${params.categoryId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.categoryId = params.categoryId;
    }

    if (params.subcategoryId) {
        if (!params.categoryId)
            throw new AppError(`categoryId not present`, 400);
        try {
            const subcategory = await cityListingRepo.getSubCategory(
                {
                    id: params.subcategoryId,
                    categoryId: params.categoryId
                },
                cityId
            );
            if (!subcategory) {
                throw new AppError(`Invalid Sub Category '${params.subcategoryId}' given`, 400);
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
        filters.subcategoryId = params.subcategoryId;
    }

    if (params.userId) {
        try {
            const user = await userRepo.getCityUserCityMapping(cityId, params.userId);
            if (user) {
                filters.userId = user.cityUserId;
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    try {
        listings = await listingRepo.getAllListingsWithFilters(filters, cityId, pageNo, pageSize);
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
                params.translate
            );

            for (let i = 0; i < noOfListings; i++) {
                if (
                    translations[2 * i].detectedSourceLang !==
                    params.translate.slice(0, 2)
                ) {
                    listings[i].titleLanguage =
                        translations[2 * i].detectedSourceLang;
                    listings[i].titleTranslation = translations[2 * i].text;
                }
                if (
                    translations[2 * i + 1].detectedSourceLang !==
                    params.translate.slice(0, 2)
                ) {
                    listings[i].descriptionLanguage =
                        translations[2 * i + 1].detectedSourceLang;
                    listings[i].descriptionTranslation =
                        translations[2 * i + 1].text;
                }
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    }

    return listings;
}

const updateCityListing = async function (id, cityId, payload, userId, roleId) {
    const updationData = {};

    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid ListingsId ${id}`, 404);
    }

    const response = await userRepo.getCityUserCityMapping(cityId, userId);
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
            const data = await cityListingRepo.getCategoryById(payload.categoryId, cityId);
            if (!data) {
                throw new AppError(`Invalid Category '${payload.categoryId}' given`, 400);
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
            if (parseInt(payload.categoryId) === categories.News && !payload.timeless) {
                if (payload.expiryDate) {
                    updationData.expiryDate = getDateInFormate(new Date(payload.expiryDate));
                } else {
                    updationData.expiryDate = getDateInFormate(new Date(new Date(updationData.updatedAt).getTime() + 1000 * 60 * 60 * 24 * 14));
                }
            }

            else if (parseInt(payload.categoryId) === categories.Events) {
                if (payload.startDate) {
                    updationData.startDate = getDateInFormate(new Date(payload.startDate));
                } else {
                    throw new AppError(`Start date is not present`, 400);
                }
                if (payload.endDate) {
                    updationData.endDate = getDateInFormate(new Date(payload.endDate));
                    updationData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
                } else {
                    updationData.expiryDate = getDateInFormate(new Date(new Date(payload.startDate).getTime() + 1000 * 60 * 60 * 24));
                }
            } else {
                updationData.expiryDate = null
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Invalid time format ${error}`, 400);
        }
        try {
            const response = await listingRepo.getCityListingImage(id, cityId);
            const hasDefaultImage = response && response.logo.startsWith("admin");
            if (hasDefaultImage) {

                await listingRepo.deleteListingImage(id, cityId);
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
                400
            );
        }
        try {
            const subcategory = await cityListingRepo.getSubCategoryById(payload.subcategoryId, cityId);
            if (!subcategory) {
                throw new AppError(`Invalid Sub Category '${payload.subcategoryId}' given`, 400);
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
            throw new AppError(`Length of Description cannot exceed 65535 characters`, 400);
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
        throw new AppError(`Invalid Input, logo and removeImage both fields present`, 400);
    }

    if (payload.pdf && payload.removePdf) {
        throw new AppError(`Invalid Input, pdf and removePdf both fields present`, 400);
    }
    if (payload.pdf) {
        updationData.pdf = payload.pdf;
    }
    if (payload.removePdf) {
        updationData.pdf = null;
    }

    if (payload.statusId !== currentListingData.statusId && roleId === roles.Admin) {
        try {
            const status = await cityListingRepo.getStatusById(payload.statusId, cityId);
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
        await cityListingRepo.updateCityListing(id, updationData, cityId);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const uploadImageForCityListing = async function (listingId, cityId, userId, roleId, image) {
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

    const currentListingData = await listingRepo.getCityListingWithId(listingId, cityId);
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (
        currentListingData.userId !== cityUserId &&
        roleId !== roles.Admin
    ) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    if (currentListingData.pdf && currentListingData.pdf.length > 0) {
        throw new AppError(`Pdf is present in listing So can not upload image.`, 403);
    }

    if (!image) {
        throw new AppError(`Image not uploaded`, 400);
    }
    const imageArr = image ? image.length > 1 ? image : [image] : [];
    const hasIncorrectMime = imageArr.some(
        (i) => !i.mimetype.includes("image/")
    );
    if (hasIncorrectMime) {
        throw new AppError(`Invalid Image type`, 403);
    }

    let imageOrder = 0;
    const listingImages = await cityListingRepo.getListingImages(listingId, cityId);
    if (listingImages[0].logo.startsWith("admin/")) {
        await cityListingRepo.deleteListingImage(listingId, cityId);
    } else {
        const imagesToRetain = listingImages.filter(value => (image || []).includes(value.logo));
        const imagesToDelete = listingImages.filter(value => !imagesToRetain.map(i2r => i2r.logo).includes(value.logo));

        if (imagesToDelete && imagesToDelete.length > 0) {
            await imageDeleteAsync.deleteMultiple(imagesToDelete.map(i => i.logo))
            await cityListingRepo.deleteListingImageById(imagesToDelete.map(i => i.id), cityId);
        }


        if (imagesToRetain && imagesToRetain.length > 0) {
            for (const imageToRetain of imagesToRetain) {
                await cityListingRepo.updateListingImage(imageToRetain.id, { imageOrder: ++imageOrder }, cityId);
            }
        }
        if (imagesToRetain.length === 0 && imageArr.length === 0) {
            await addDefaultImage(cityId, listingId, currentListingData.categoryId)
        }
    }

    try {
        for (const individualImage of imageArr) {
            imageOrder++;
            const filePath = `user_${userId}/city_${cityId}_listing_${listingId}_${imageOrder}_${Date.now()}`;
            const { uploadStatus, objectKey } = await imageUpload(
                individualImage,
                filePath
            );
            if (uploadStatus === "Success") {
                await cityListingRepo.createListingImage(cityId, listingId, imageOrder, objectKey);
            } else {
                throw new AppError("Image Upload failed");
            }
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const uploadPDFForCityListing = async function (listingId, cityId, userId, roleId, pdf) {
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

    const currentListingData = await listingRepo.getCityListingWithId(listingId, cityId);
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (
        currentListingData.userId !== cityUserId &&
        roleId !== roles.Admin
    ) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (currentListingData.logo && currentListingData.logo.length > 0) {
        throw new AppError(`Image is present in listing So can not upload pdf.`, 403);
    }

    if (!pdf) {
        throw new AppError(`Pdf not uploaded`, 400);
    }

    const arrayOfAllowedFiles = ['pdf'];
    const arrayOfAllowedFileTypes = ['application/pdf'];

    const fileExtension = pdf.name.slice(
        ((pdf.name.lastIndexOf('.') - 1) >>> 0) + 2
    );

    if (!arrayOfAllowedFiles.includes(fileExtension) || !arrayOfAllowedFileTypes.includes(pdf.mimetype)) {
        throw new AppError(`Invalid Pdf type`, 403);
    }

    try {
        const filePath = `user_${userId}/city_${cityId}_listing_${listingId}_${Date.now()}_PDF.pdf`;
        const { uploadStatus, objectKey } = await pdfUpload(
            pdf,
            filePath
        );
        const pdfUploadStatus = uploadStatus;
        const pdfObjectKey = objectKey;

        const updationData = { pdf: pdfObjectKey };
        const pdfBucketPath = "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST;

        if (pdfUploadStatus === "Success") {
            // create image
            const pdfFilePath = `${pdfBucketPath}/${filePath}`;
            const imageOrder = 1;
            const imagePath = `user_${userId}/city_${cityId}_listing_${listingId}_${imageOrder}`;
            const pdfImageBuffer = await getPdfImage(pdfFilePath);
            const { uploadStatus, objectKey } = await imageUpload(
                pdfImageBuffer,
                imagePath
            );

            if (uploadStatus === "Success") {
                // update logo
                await cityListingRepo.createListingImage(cityId, listingId, imageOrder, objectKey);
            }

            await cityListingRepo.updateCityListing(listingId, updationData, cityId);
        } else {
            throw new AppError("pdf Upload failed");
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

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

    if (
        currentListingData.userId !== cityUserId &&
        roleId !== roles.Admin
    ) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }
    try {
        const onSucccess = async () => {
            await cityListingRepo.deleteListingImage(id, cityId);
            await addDefaultImage(cityId, id, currentListingData.categoryId);

        };
        const onFail = (err) => {
            throw new AppError("Image Delete failed with Error Code: " + err);
        };

        const userImageList = await bucketClient.fetchUserImages(userId, cityId, id);
        await imageDeleteMultiple(userImageList.map((image) => ({ Key: image.Key._text })), onSucccess, onFail);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}


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
        throw new AppError(`Listing with id ${id} does not exist`, 404)
    }

    if (
        currentListingData.userId !== cityUserId &&
        roleId !== roles.Admin
    ) {
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
            onFail
        );
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

const deleteCityListing = async function (id, cityId, userId, roleId) {
    if (!cityId || isNaN(cityId)) {
        throw new AppError(`invalid cityId given`, 400);
    }
    if (isNaN(Number(id)) || Number(id) <= 0) {
        throw new AppError(`Invalid entry ${id}`, 404);
    }

    try {
        const response = await cityRepo.getCityWithId(cityId);
        if (!response) {
            throw new AppError(`City '${cityId}' not found`, 404);
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }

    const currentListingData = await listingRepo.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    const userImageList = await bucketClient.fetchUserImages(userId, cityId, id);

    const response = await userRepo.getCityUserCityMapping(cityId, userId);
    const cityUserId = response ? response.cityUserId : null;
    if (
        currentListingData.userId !== cityUserId &&
        roleId !== roles.Admin
    ) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    const onSucccess = async () => {
        await cityListingRepo.deleteListingImage(id, cityId);
        await cityListingRepo.deleteCityListing(id, cityId);
    };
    const onFail = (err) => {
        throw new AppError("Image Delete failed with Error Code: " + err);
    };

    await imageDeleteMultiple(
        userImageList.map((image) => ({ Key: image.Key._text })),
        onSucccess,
        onFail
    );
}

async function addDefaultImage(cityId, listingId, categoryId) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find((key) => categories[key] === +categoryId);

    const categoryCount = await cityListingRepo.getCountByCategory(cityId, categoryName);
    const moduloValue = (categoryCount % defaultImageCount[categoryName]) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    // Create listing image
    return await cityListingRepo.createListingImage(cityId, listingId, imageOrder, imageName);
}

async function addDefaultImageWithTransaction(cityId, listingId, categoryId, transaction) {
    const imageOrder = 1;
    const categoryName = Object.keys(categories).find((key) => categories[key] === +categoryId);

    const categoryCount = await cityListingRepo.getCountByCategory(cityId, categoryName);
    const moduloValue = (categoryCount % defaultImageCount[categoryName]) + 1;
    const imageName = `admin/${categoryName}/${DEFAULTIMAGE}${moduloValue}.png`;

    // Create listing image
    return await cityListingRepo.createListingImageWithTransaction(listingId, imageOrder, imageName, transaction);
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
    addDefaultImageWithTransaction
}