const status = require("../constants/status");
const source = require("../constants/source");
const categories = require("../constants/categories");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate")
const database = require("../services/database");
// const tables = require("../constants/tableNames");
const subcategories = require("../constants/subcategories");
const roles = require("../constants/roles");
const userServices = require("../services/users");
const cityServices = require("../services/cities");
const cityListingServices = require("../services/cityListing");
const listingService = require("../services/listingService");
const imageUpload = require("../utils/imageUpload");
const getPdfImage = require("../utils/getPdfImage");
const pdfUpload = require("../utils/pdfUpload")
const objectDelete = require("../utils/imageDelete");


const deepl = require("deepl-node");
const supportedLanguages = require("../constants/supportedLanguages");

const createCityListing = async function (req, res, next) {
    const payload = req.body;
    const cityId = req.cityId;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        const insertionData = {};
        let user = {};
        let city = {};

        if (!payload) {
            return next(new AppError(`Empty payload sent`, 400));
        }
        if (!cityId) {
            return next(new AppError(`City is not present`, 404));
        }

        city = await cityServices.getCityWithId(cityId);
        if (!city) {
            return next(new AppError(`Invalid City '${cityId}' given`, 400));
        }

        user = await userServices.getUserById(userId);
        if (!user) {
            return next(new AppError(`Invalid User '${userId}' given`, 400));
        }

        if (
            typeof parseInt(payload.villageId) === "number" &&
            parseInt(payload.villageId) !== 0
        ) {
            const village = await cityListingServices.getVillageById(
                payload.villageId,
                cityId
            );
            if (!village) {
                return next(new AppError(`Invalid Village id '${payload.villageId}' given`, 400));
            }
            insertionData.villageId = village.id;
        } else {
            insertionData.villageId = null;
        }

        if (!payload.title) {
            return next(new AppError(`Title is not present`, 400));
        } else if (payload.title.length > 255) {
            return next(new AppError(`Length of Title cannot exceed 255 characters`, 400));
        } else {
            insertionData.title = payload.title;
        }

        if (!payload.place) {
            insertionData.place = payload.place;
        }

        if (!payload.description) {
            return next(new AppError(`Description is not present`, 400));
        } else if (payload.description.length > 65535) {
            return next(new AppError(`Length of Description cannot exceed 65535 characters`, 400));
        } else {
            insertionData.description = payload.description;
        }

        if (payload.media) {
            insertionData.media = payload.media;
        }

        if (!payload.categoryId) {
            return next(new AppError(`Category is not present`, 400));
        } else {
            const category = await cityListingServices.getCategoryById(payload.categoryId, cityId);
            if (!category) {
                return next(new AppError(`Invalid Category '${payload.categoryId}' given`, 400));
            }
            insertionData.categoryId = payload.categoryId;
        }

        if (payload.subcategoryId) {
            const subcategory = await cityListingServices.getSubCategoryById(payload.subcategoryId, cityId);
            if (!subcategory) {
                return next(new AppError(`Invalid Sub Category '${payload.subcategoryId}' given`, 400));
            }
            insertionData.subcategoryId = payload.subcategoryId;
        }

        if (!payload.statusId) {
            insertionData.statusId = status.Pending;
        } else {
            if (roleId !== roles.Admin) {
                insertionData.statusId = status.Pending;
            } else {
                const status = await cityListingServices.getStatusById(payload.statusId, cityId);
                if (!status) {
                    return next(new AppError(`Invalid Status '${payload.statusId}' given`, 400));
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
                return next(new AppError(`Invalid email Id given`, 400));
            }
            insertionData.email = payload.email;
        }

        if (payload.phone) {
            const re = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
            if (!re.test(payload.phone)) {
                return next(new AppError(`Invalid Phone number given`, 400));
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

        try {
            if (parseInt(payload.categoryId) === categories.Events) {
                if (payload.startDate) {
                    insertionData.startDate = getDateInFormate(new Date(payload.startDate));
                } else {
                    return next(new AppError(`Start date is not present`, 400));
                }

                if (
                    parseInt(payload.subcategoryId) === subcategories.timelessNews
                ) {
                    return next(new AppError(`Timeless News should not have an end date.`, 400));
                }
                if (payload.endDate) {
                    if (parseInt(payload.subcategoryId) === subcategories.timelessNews) {
                        return next(new AppError(`Timeless News should not have an end date.`, 400));
                    }
                    insertionData.endDate = getDateInFormate(new Date(payload.endDate));
                    insertionData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
                } else {
                    insertionData.expiryDate = new Date(new Date(payload.startDate).getTime() + 1000 * 60 * 60 * 24)
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " ");
                }
            }
            if (parseInt(payload.categoryId) === categories.News) {
                insertionData.expiryDate = getDateInFormate(new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 15));
            }
            insertionData.createdAt = getDateInFormate(new Date());
        } catch (error) {
            return next(new AppError(`Invalid time format ${error}`, 400));
        }

        const transaction = await database.createTransaction(cityId);
        const heidiTransaction = await database.createTransaction(); // for root database
        try {
            const transaction = await database.createTransaction(cityId);
            let response = {};
            const userId = user.id;
            if (city.isAdminListings) {
                // If the city is admin listings, we need directly set the user id of the listing as 1 (i.e. admin's id)
                insertionData.userId = 1;
            } else {
                response = await cityListingServices.getCityUserMapping(cityId, userId);
                if (!response) {
                    delete user.id;
                    delete user.password;
                    delete user.socialMedia;
                    delete user.emailVerified;
                    delete user.socialMedia;

                    response = await userServices.createCityUserWithTransaction(user, cityId, transaction);

                    const cityUserId = response.id;
                    await cityServices.createCityUserCityMappingWithTransaction(cityId, userId, cityUserId, transaction);
                    insertionData.userId = cityUserId;
                } else {
                    insertionData.userId = response.cityUserId;
                }
            }
            response = await listingService.createListingWithTransaction(insertionData, transaction);
            const listingId = response.id;
            await listingService.createUserListingMappingWithTransaction(cityId, userId, listingId, heidiTransaction);

            // commit both the transactions together to ensure atomicity
            await database.commitTransaction(transaction);
            await database.commitTransaction(heidiTransaction);

            res.status(200).json({
                status: "success",
                id: listingId,
            });
        } catch (err) {
            await database.rollbackTransaction(transaction);
            await database.rollbackTransaction(heidiTransaction);
            throw new AppError(err);
        }
    } catch (err) {
        return next(new AppError(err));
    }
}

const getCityListingWithId = async function (req, res, next) {
    try {
        const id = req.params.id;
        const cityId = req.cityId;
        if (!cityId || isNaN(cityId)) {
            return next(new AppError(`invalid cityId given`, 400));
        }
        if (isNaN(Number(id)) || Number(id) <= 0) {
            return next(new AppError(`Invalid ListingsId ${id}`, 404));
        }
        if (isNaN(Number(id)) || Number(cityId) <= 0) {
            return next(new AppError(`City is not present`, 404));
        } else {
            try {
                const response = await cityServices.getCityWithId(cityId);
                if (!response) {
                    return next(new AppError(`Invalid City '${cityId}' given`, 400));
                }
            } catch (err) {
                return next(new AppError(err));
            }
        }

        const data = await listingService.getCityListingWithId(id, cityId);
        if (!data) {
            return next(new AppError(`Listings with id ${id} does not exist`, 404));
        }
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

const getAllCityListings = async function (req, res, next) {
    const params = req.query;
    const cityId = req.cityId;
    const filters = {};
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);

    let listings = [];

    if (!cityId) {
        return next(new AppError(`CityId not given`, 400));
    }
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid City '${cityId}' given`, 404));
    } else {
        try {
            const city = await cityServices.getCityWithId(cityId);
            if (!city) {
                return next(new AppError(`Invalid City '${cityId}' given`, 404));
            }

        } catch (err) {
            return next(new AppError(err));
        }
    }

    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;
    if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
        return next(
            new AppError(`Please enter a positive integer for pageNo`, 400)
        );
    }

    if (
        isNaN(Number(pageSize)) ||
        Number(pageSize) <= 0 ||
        Number(pageSize) > 20
    ) {
        return next(
            new AppError(
                `Please enter a positive integer less than or equal to 20 for pageSize`,
                400
            )
        );
    }

    if (params.statusId) {
        try {
            const status = await cityListingServices.getStatusById(params.statusId, cityId);
            if (!status) {
                return next(new AppError(`Invalid Status '${params.statusId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.statusId = params.statusId;
    }

    if (params.categoryId) {
        try {
            const category = await cityListingServices.getCategoryById(params.categoryId, cityId);
            if (!category) {
                return next(new AppError(`Invalid Category '${params.categoryId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.categoryId = params.categoryId;
    }

    if (params.subcategoryId) {
        if (!params.categoryId)
            return next(new AppError(`categoryId not present`, 400));
        try {
            const subcategory = await cityListingServices.getSubCategory(
                {
                    id: params.subcategoryId,
                    categoryId: params.categoryId
                },
                cityId
            );
            if (!subcategory) {
                return next(new AppError(`Invalid Sub Category '${params.subcategoryId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.subcategoryId = params.subcategoryId;
    }

    if (params.userId) {
        try {
            const user = await userServices.getCityUserCityMapping(cityId, params.userId);
            if (user) {
                filters.userId = user.cityUserId;
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        listings = await listingService.getAllListingsWithFilters(filters, cityId, pageNo, pageSize);
        if (!listings) {
            listings = [];
        }
    } catch (err) {
        return next(new AppError(err));
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
            return next(new AppError(err));
        }
    }

    res.status(200).json({
        status: "success",
        data: listings,
    });
}


const updateCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;
    const payload = req.body;
    const updationData = {};

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid ListingsId ${id}`, 404));
        return;
    }

    const response = await userServices.getCityUserCityMapping(cityId, req.userId);
    const cityUserId = response ? response.cityUserId : null;

    const currentListingData = await listingService.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        return next(new AppError(`Listing with id ${id} does not exist`, 404));
    }

    if (
        currentListingData.userId !== cityUserId &&
        req.roleId !== roles.Admin
    ) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    if (payload.title) {
        if (payload.title.length > 255) {
            return next(
                new AppError(
                    `Length of Title cannot exceed 255 characters`,
                    400
                )
            );
        }
        updationData.title = payload.title;
    }
    if (payload.place) {
        updationData.place = payload.place;
    }
    if (payload.description) {
        if (payload.description.length > 65535) {
            return next(
                new AppError(
                    `Length of Description cannot exceed 65535 characters`,
                    400
                )
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
            return next(new AppError(`Invalid email given`, 400));
        }
        updationData.email = payload.email;
    }

    if (payload.phone && payload.phone !== currentListingData.phone) {
        const re = /^[+][(]{0,1}[0-9]{1,3}[)]{0,1}[-\s./0-9]$/g;
        if (!re.test(payload.phone)) {
            return next(new AppError(`Invalid Phone number given`, 400));
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
        return next(
            new AppError(
                `Invalid Input, logo and removeImage both fields present`,
                400
            )
        );
    }
    if (payload.logo) {
        updationData.logo = payload.logo;
    }
    if (payload.removeImage) {
        updationData.logo = null;
    }

    if (payload.pdf && payload.removePdf) {
        return next(
            new AppError(
                `Invalid Input, pdf and removePdf both fields present`,
                400
            )
        );
    }
    if (payload.pdf) {
        updationData.pdf = payload.pdf;
    }
    if (payload.removePdf) {
        updationData.pdf = null;
    }

    if (payload.statusId !== currentListingData.statusId) {
        if (req.roleId !== roles.Admin)
            return next(
                new AppError("You dont have access to change this option", 403)
            );
        try {
            const status = await cityListingServices.getStatusById(payload.statusId, cityId);
            if (!status) {
                return next(new AppError(`Invalid Status '${payload.statusId}' given`, 400));
            }
            updationData.statusId = payload.statusId;
        } catch (err) {
            return next(new AppError(err));
        }

        if (parseInt(req.roleId) === roles.Admin)
            updationData.statusId = payload.statusId;
        else
            return next(
                new AppError("You dont have access to change this option", 403)
            );
    }
    if (payload.longitude) {
        updationData.longitude = payload.longitude;
    }
    if (payload.latitude) {
        updationData.latitude = payload.latitude;
    }

    try {
        if (payload.startDate) {
            updationData.startDate = getDateInFormate(new Date(payload.startDate));
        }

        if (payload.endDate) {
            if (parseInt(payload.subcategoryId) === subcategories.timelessNews) {
                return next(new AppError(`Timeless News should not have an end date.`, 400));
            }
            updationData.endDate = getDateInFormate(new Date(payload.endDate));
            updationData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
        }
    } catch (error) {
        return next(new AppError(`Invalid time format ${error}`, 400));
    }

    try {
        await cityListingServices.updateCityListing(id, updationData, cityId);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

const uploadImageForCityListing = async function (req, res, next) {
    const listingId = req.params.id;
    const cityId = req.cityId;

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await cityServices.getCityWithId(cityId);
            if (!response) {
                return next(new AppError(`City '${cityId}' not found`, 404));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        next(new AppError(`Invalid ListingsId ${listingId} given`, 400));
        return;
    }

    const response = await userServices.getCityUserCityMapping(cityId, req.userId);
    const cityUserId = response ? response.cityUserId : null;

    const currentListingData = await listingService.getCityListingWithId(listingId, cityId);
    if (!currentListingData) {
        return next(new AppError(`Listing with id ${listingId} does not exist`, 404));
    }

    if (
        currentListingData.userId !== cityUserId &&
        req.roleId !== roles.Admin
    ) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    if (currentListingData.pdf && currentListingData.pdf.length > 0) {
        return next(
            new AppError(`Pdf is present in listing So can not upload image.`, 403)
        );
    }
    const { image } = req.files;

    if (!image) {
        next(new AppError(`Image not uploaded`, 400));
        return;
    }

    if (!image.mimetype.includes("image/")) {
        return next(
            new AppError(`Invalid Image type`, 403)
        );
    }

    try {
        const filePath = `user_${req.userId}/city_${cityId}_listing_${listingId}`;

        const { uploadStatus, objectKey } = await imageUpload(
            image,
            filePath
        );
        const updationData = { logo: objectKey };

        if (uploadStatus === "Success") {
            await cityListingServices.updateCityListing(listingId, updationData, cityId);

            return res.status(200).json({
                status: "success",
            });
        } else {
            return next(new AppError("Image Upload failed"));
        }
    } catch (err) {
        return next(new AppError(err));
    }
}

const uploadPDFForCityListing = async function (req, res, next) {
    const listingId = req.params.id;
    const cityId = req.cityId;

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await cityServices.getCityWithId(cityId);
            if (!response) {
                return next(new AppError(`City '${cityId}' not found`, 404));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (isNaN(Number(listingId)) || Number(listingId) <= 0) {
        next(new AppError(`Invalid ListingsId ${listingId} given`, 400));
        return;
    }

    const response = await userServices.getCityUserCityMapping(cityId, req.userId);
    const cityUserId = response ? response.cityUserId : null;

    const currentListingData = await listingService.getCityListingWithId(listingId, cityId);
    if (!currentListingData) {
        return next(new AppError(`Listing with id ${listingId} does not exist`, 404));
    }

    if (
        currentListingData.userId !== cityUserId &&
        req.roleId !== roles.Admin
    ) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    if (currentListingData.logo && currentListingData.logo.length > 0) {
        return next(
            new AppError(`Image is present in listing So can not upload pdf.`, 403)
        );
    }
    const { pdf } = req.files;

    if (!pdf) {
        next(new AppError(`Pdf not uploaded`, 400));
        return;
    }

    const arrayOfAllowedFiles = ['pdf'];
    const arrayOfAllowedFileTypes = ['application/pdf'];

    const fileExtension = pdf.name.slice(
        ((pdf.name.lastIndexOf('.') - 1) >>> 0) + 2
    );

    if (!arrayOfAllowedFiles.includes(fileExtension) || !arrayOfAllowedFileTypes.includes(pdf.mimetype)) {
        return next(
            new AppError(`Invalid Pdf type`, 403)
        );
    }

    try {
        const filePath = `user_${req.userId}/city_${cityId}_listing_${listingId}_PDF.pdf`;
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
            const imagePath = `user_${req.userId}/city_${cityId}_listing_${listingId}`;
            const pdfImageBuffer = await getPdfImage(pdfFilePath);
            const { uploadStatus, objectKey } = await imageUpload(
                pdfImageBuffer,
                imagePath
            );

            if (uploadStatus === "Success") {
                // update logo
                updationData.logo = objectKey;
            }

            await cityListingServices.updateCityListing(listingId, updationData, cityId);

            return res.status(200).json({
                status: "success",
            });
        } else {
            return next(new AppError("pdf Upload failed"));
        }
    } catch (err) {
        return next(new AppError(err));
    }
}

const deleteImageForCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await cityServices.getCityWithId(cityId);
            if (!response) {
                return next(new AppError(`City '${cityId}' not found`, 404));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid ListingsId ${id}`, 404));
        return;
    }

    const response = await userServices.getCityUserCityMapping(cityId, req.userId);

    // The current user might not be in the city db
    const cityUserId = response ? response.cityUserId : null;
    const currentListingData = await listingService.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        return next(new AppError(`Listing with id ${id} does not exist`, 404));
    }

    if (
        currentListingData.userId !== cityUserId &&
        req.roleId !== roles.Admin
    ) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    try {
        const onSucccess = async () => {
            const updationData = {};
            updationData.logo = "";

            await cityListingServices.updateCityListing(id, updationData, cityId);
            return res.status(200).json({
                status: "success",
            });
        };
        const onFail = (err) => {
            return next(
                new AppError("Image Delete failed with Error Code: " + err)
            );
        };
        await objectDelete(
            `user_${req.userId}/city_${cityId}_listing_${id}`,
            onSucccess,
            onFail
        );
    } catch (err) {
        return next(new AppError(err));
    }
}

const deletePDFForCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await cityServices.getCityWithId(cityId);
            if (!response) {
                return next(new AppError(`City '${cityId}' not found`, 404));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid ListingsId ${id}`, 404));
        return;
    }

    const response = await userServices.getCityUserCityMapping(cityId, req.userId);

    // The current user might not be in the city db
    const cityUserId = response ? response.cityUserId : null;
    const currentListingData = await listingService.getCityListingWithId(id, cityId);

    if (
        currentListingData.userId !== cityUserId &&
        req.roleId !== roles.Admin
    ) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    try {
        const onSucccess = async () => {
            const updationData = {};
            updationData.pdf = "";

            await cityListingServices.updateCityListing(id, updationData, cityId);
            return res.status(200).json({
                status: "success",
            });
        };
        const onFail = (err) => {
            return next(
                new AppError("Pdf Delete failed with Error Code: " + err)
            );
        };
        await objectDelete(
            `user_${req.userId}/city_${cityId}_listing_${id}_PDF.pdf`,
            onSucccess,
            onFail
        );
    } catch (err) {
        return next(new AppError(err));
    }
}

const deleteCityListing = async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid entry ${id}`, 404));
        return;
    }

    try {
        const response = await cityServices.getCityWithId(cityId);
        if (!response) {
            return next(new AppError(`City '${cityId}' not found`, 404));
        }
    } catch (err) {
        return next(new AppError(err));
    }

    const currentListingData = await listingService.getCityListingWithId(id, cityId);
    if (!currentListingData) {
        return next(new AppError(`Listing with id ${id} does not exist`, 404));
    }

    const response = await userServices.getCityUserCityMapping(cityId, req.userId);
    const cityUserId = response ? response.cityUserId : null;
    if (
        currentListingData.userId !== cityUserId &&
        req.roleId !== roles.Admin
    ) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }

    const onSucccess = async () => {
        await cityListingServices.deleteCityListing(id, cityId);
        return res.status(200).json({
            status: "success",
        });
    };
    const onFail = (err) => {
        return next(
            new AppError("Image Delete failed with Error Code: " + err)
        );
    };
    await objectDelete(currentListingData.logo, onSucccess, onFail);
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
}