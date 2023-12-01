const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const categories = require("../constants/categories");
const subcategories = require("../constants/subcategories");
const source = require("../constants/source");
const roles = require("../constants/roles");
const supportedLanguages = require("../constants/supportedLanguages");
const status = require("../constants/status");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const deepl = require("deepl-node");
const imageUpload = require("../utils/imageUpload");
const pdfUpload = require("../utils/pdfUpload");
const objectDelete = require("../utils/imageDelete");
const getDateInFormate = require("../utils/getDateInFormate")
const axios = require("axios");
const parser = require("xml-js");
const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const getPdfImage = require("../utils/getPdfImage");

// const radiusSearch = require('../services/handler')

router.get("/", async function (req, res, next) {
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
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
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
            const response = await database.get(
                tables.STATUS_TABLE,
                { id: params.statusId },
                null,
                cityId
            );

            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Status '${params.statusId}' given`, 400)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.statusId = params.statusId;
    }

    if (params.categoryId) {
        try {
            const response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: params.categoryId },
                null,
                cityId
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Category '${params.categoryId}' given`, 400)
                );
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
            const response = await database.get(
                tables.SUBCATEGORIES_TABLE,
                { id: params.subcategoryId, categoryId: params.categoryId },
                null,
                cityId
            );
            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(
                        `Invalid subcategory '${params.subcategoryId}' given`,
                        400
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        filters.subcategoryId = params.subcategoryId;
    }

    if (params.userId) {
        try {
            const response = await database.get(
                tables.USER_CITYUSER_MAPPING_TABLE,
                { userId: params.userId, cityId },
                null
            );

            const data = response.rows;
            if (data) {
                filters.userId = data[0].cityUserId;
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        const response = await database.get(
            tables.LISTINGS_TABLE,
            filters,
            null,
            cityId,
            pageNo,
            pageSize
        );
        listings = response.rows;
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
            return next(new AppError(err));
        }
    }

    res.status(200).json({
        status: "success",
        data: listings,
    });
});

router.get("/:id", async function (req, res, next) {
    const id = req.params.id;
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid ListingsId ${id}`, 404));
        return;
    }

    if (isNaN(Number(id)) || Number(cityId) <= 0) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Invalid City '${cityId}' given`, 404));
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(tables.LISTINGS_TABLE, { id }, null, cityId)
        .then(async (response) => {
            const data = response.rows;
            if (!data || data.length === 0) {
                return next(new AppError(`Listings with id ${id} does not exist`, 404));
            }
            const listingImagesList = await database.get(
                tables.LISTINGS_IMAGES_TABLE,
                { listingId: id },
                null,
                cityId
            );

            res.status(200).json({
                status: "success",
                data: { ...data[0], logo: listingImagesList.rows[0].logo, otherlogos: listingImagesList.rows },
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.post("/", authentication, async function (req, res, next) {
    const payload = req.body;
    const cityId = req.cityId;
    const insertionData = {};
    let user = {};
    let city = {};
    const userId = req.userId;  

    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
                return next(new AppError(`Invalid City '${cityId}' given`, 400));
            }
            city = response.rows[0];
        } catch (err) {
            return next(new AppError(err));
        }
    }

    try {
        const response = await database.get(tables.USER_TABLE, { id: userId });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(new AppError(`Invalid User '${userId}' given`, 400));
        }
        user = data[0];
    } catch (err) {
        return next(new AppError(err));
    }

    if (
        typeof parseInt(payload.villageId) === "number" &&
    parseInt(payload.villageId) !== 0
    ) {
        try {
            const response = await database.get(
                tables.VILLAGE_TABLE,
                { id: payload.villageId },
                null,
                cityId
            );

            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Village id '${payload.villageId}' given`, 400)
                );
            } else {
                insertionData.villageId = payload.villageId;
            }
        } catch (err) {
            return next(new AppError(err));
        }
    } else {
        insertionData.villageId = null;
    }

    if (!payload.title) {
        return next(new AppError(`Title is not present`, 400));
    } else if (payload.title.length > 255) {
        return next(
            new AppError(`Length of Title cannot exceed 255 characters`, 400)
        );
    } else {
        insertionData.title = payload.title;
    }
    if (!payload.place) {
        insertionData.place = payload.place;
    }

    if (!payload.description) {
        return next(new AppError(`Description is not present`, 400));
    } else if (payload.description.length > 65535) {
        return next(
            new AppError(
                `Length of Description cannot exceed 65535 characters`,
                400
            )
        );
    } else {
        insertionData.description = payload.description;
    }
    if (payload.media) {
        insertionData.media = payload.media;
    }
    if (!payload.categoryId) {
        return next(new AppError(`Category is not present`, 400));
    } else {
        try {
            const response = await database.get(
                tables.CATEGORIES_TABLE,
                { id: payload.categoryId },
                null,
                cityId
            );

            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Category '${payload.categoryId}' given`, 400)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.categoryId = payload.categoryId;
    }

    if (payload.subcategoryId) {
        try {
            const response = await database.get(
                tables.SUBCATEGORIES_TABLE,
                { id: payload.subcategoryId },
                null,
                cityId
            );

            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(
                        `Invalid Sub Category '${payload.subcategoryId}' given`,
                        400
                    )
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.subcategoryId = payload.subcategoryId;
    }

    if (!payload.statusId) {
        insertionData.statusId = status.Pending;
    } else {
        if (req.roleId !== roles.Admin) {
            insertionData.statusId = status.Pending;
        } else {
            try {
                const response = await database.get(
                    tables.STATUS_TABLE,
                    { id: payload.statusId },
                    null,
                    cityId
                );

                const data = response.rows;
                if (data && data.length === 0) {
                    return next(
                        new AppError(`Invalid Status '${payload.statusId}' given`, 400)
                    );
                }
            } catch (err) {
                return next(new AppError(err));
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

    if (payload.zipcode){
        insertionData.zipcode = payload.zipcode;
    }
    try {
        if (parseInt(payload.categoryId) === categories.Events) {

            if (payload.startDate) {
                insertionData.startDate = getDateInFormate(new Date(payload.startDate));
            } else {
                return next(new AppError(`Start date is not present`, 400));
            }

            if (payload.endDate) {
                if (parseInt(payload.subcategoryId) === subcategories.timelessNews){
                    return next(new AppError(`Timeless News should not have an end date.`, 400));
                }
                insertionData.endDate = getDateInFormate(new Date(payload.endDate));
                insertionData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
            } else {
                if (parseInt(payload.subcategoryId) !== subcategories.timelessNews){
                    insertionData.expiryDate = new Date(new Date(payload.startDate).getTime() + 1000 * 60 * 60 * 24)
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " ");
                }
            }
        }
        if (parseInt(payload.categoryId) === categories.News) {
            insertionData.expiryDate = getDateInFormate(new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 15));
        }
        insertionData.createdAt = getDateInFormate(new Date());
    } catch (error) {
        return next(new AppError(`Invalid time format ${error}`, 400));
    }

    try {
        let response = {};
        const userId = user.id;
        if (city.isAdminListings) {
            // If the city is admin listings, we need directly set the user id of the listing as 1 (i.e. admin's id)
            insertionData.userId = 1;
        } else {
            response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
                cityId,
                userId,
            });

            if (!response.rows || response.rows.length === 0) {
                delete user.id;
                delete user.password;
                delete user.socialMedia;
                delete user.emailVerified;
                delete user.socialMedia;
                response = await database.create(tables.USER_TABLE, user, cityId);

                const cityUserId = response.id;
                await database.create(tables.USER_CITYUSER_MAPPING_TABLE, {
                    cityId,
                    userId,
                    cityUserId,
                });
                insertionData.userId = cityUserId;
            } else {
                insertionData.userId = response.rows[0].cityUserId;
            }
        }

        response = await database.create(
            tables.LISTINGS_TABLE,
            insertionData,
            cityId
        );

        const listingId = response.id;
        await database.create(tables.USER_LISTING_MAPPING_TABLE, {
            cityId,
            userId,
            listingId,
        });
        res.status(200).json({
            status: "success",
            id: listingId,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

router.patch("/:id", authentication, async function (req, res, next) {
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

    let response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId: req.userId, cityId },
        "cityUserId"
    );

    // The current user might not be in the city db
    const cityUserId =
    response.rows && response.rows.length > 0
        ? response.rows[0].cityUserId
        : null;

    response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);

    if (!response.rows || response.rows.length === 0) {
        return next(new AppError(`Listing with id ${id} does not exist`, 404));
    }
    const currentListingData = response.rows[0];

    if (currentListingData.userId !== cityUserId && req.roleId !== roles.Admin) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    if (payload.title) {
        if (payload.title.length > 255) {
            return next(
                new AppError(`Length of Title cannot exceed 255 characters`, 400)
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
    if(payload.zipcode){
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

    if (payload.removeImage) {
    // await database.deleteData(
    //     tables.LISTINGS_IMAGES_TABLE,
    //     { listingId: id },
    //     cityId
    // );
    // updationData.logo = null;
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
            const response = await database.get(
                tables.STATUS_TABLE,
                { id: payload.statusId },
                null,
                cityId
            );

            const data = response.rows;
            if (data && data.length === 0) {
                return next(
                    new AppError(`Invalid Status '${payload.statusId}' given`, 400)
                );
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
            if (parseInt(payload.subcategoryId) === subcategories.timelessNews){
                return next(new AppError(`Timeless News should not have an end date.`, 400));
            }
            updationData.endDate = getDateInFormate(new Date(payload.endDate));
            updationData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
        }
    } catch (error) {
        return next(new AppError(`Invalid time format ${error}`, 400));
    }

    database
        .update(tables.LISTINGS_TABLE, updationData, { id }, cityId)
        .then((response) => {
            res.status(200).json({
                status: "success",
                id,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.delete("/:id", authentication, async function (req, res, next) {
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
        const response = await database.get(tables.CITIES_TABLE, {
            id: cityId,
        });
        if (response.rows && response.rows.length === 0) {
            return next(
                new AppError(`Invalid City '${cityId}' given`, 404)
            );
        }
    } catch (err) {
        return next(new AppError(err));
    }

    let response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);
    if (!response.rows || response.rows.length === 0) {
        return next(new AppError(`Listing with id ${id} does not exist`, 404));
    }

    const currentListingData = response.rows[0];

    let imageList = await axios.get(
        "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST
    );
    imageList = JSON.parse(
        parser.xml2json(imageList.data, { compact: true, spaces: 4 })
    );
    const userImageList = imageList.ListBucketResult.Contents.filter((obj) =>
        obj.Key._text.includes(`user_${req.userId}/city_${cityId}_listing_${id}`)
    );
    response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId: req.userId, cityId },
        "cityUserId"
    );

    if (req.roleId !== roles.Admin && (!response.rows || response.rows.length === 0 || response.rows[0].cityUserId !== currentListingData.userId)) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    
    const onSucccess = async () => {
        await database.deleteData(
            tables.LISTINGS_IMAGES_TABLE,
            { listingId: id },
            cityId
        );
        await database.deleteData(tables.LISTINGS_TABLE, { id }, cityId);
        return res.status(200).json({
            status: "success",
        });
    };
    const onFail = (err) => {
        return next(new AppError("Image Delete failed with Error Code: " + err));
    };
    await imageDeleteMultiple(
        userImageList.map((image) => ({ Key: image.Key._text })),
        onSucccess,
        onFail
    );
});

router.post(
    "/:id/imageUpload",
    authentication,
    async function (req, res, next) {
        const listingId = req.params.id;
        const cityId = req.cityId;
        if (!cityId) {
            return next(new AppError(`City is not present`, 404));
        } else {
            try {
                const response = await database.get(tables.CITIES_TABLE, {
                    id: cityId,
                });
                if (response.rows && response.rows.length === 0) {
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

        let response = await database.get(
            tables.USER_CITYUSER_MAPPING_TABLE,
            { userId: req.userId, cityId },
            "cityUserId"
        );

        // The current user might not be in the city db
        const cityUserId =
      response.rows && response.rows.length > 0
          ? response.rows[0].cityUserId
          : null;

        response = await database.get(
            tables.LISTINGS_TABLE,
            { id: listingId },
            null,
            cityId
        );
        if (!response.rows || response.rows.length === 0) {
            return next(
                new AppError(`Listing with id ${listingId} does not exist`, 404)
            );
        }
        const currentListingData = response.rows[0];

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
        const imageArr = image.length > 1 ? image : [image];
        const hasIncorrectMime = imageArr.some(
            (i) => !i.mimetype.includes("image/")
        );
        if (hasIncorrectMime) {
            return next(new AppError(`Invalid Image type`, 403));
        }

        try {
            await database.deleteData(
                tables.LISTINGS_IMAGES_TABLE,
                { listingId },
                cityId
            );

            await imageArr.map(async (individualImage, index) => {
                const imageOrder = index + 1;
                const filePath = `user_${req.userId}/city_${cityId}_listing_${listingId}_${imageOrder}`;
                const { uploadStatus, objectKey } = await imageUpload(
                    individualImage,
                    filePath
                );
                if (uploadStatus === "Success") {
                    await database.create(
                        tables.LISTINGS_IMAGES_TABLE,
                        {
                            listingId,
                            imageOrder,
                            logo: objectKey,
                        },
                        cityId
                    );
                } else {
                    return next(new AppError("Image Upload failed"));
                }
            });
            return res.status(200).json({
                status: "success",
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
);

router.post("/:id/pdfUpload", authentication, async function (req, res, next) {
    const listingId = req.params.id;
    const cityId = req.cityId;

    if (!cityId) {
        return next(new AppError(`City is not present`, 404));
    } else {
        try {
            const response = await database.get(tables.CITIES_TABLE, {
                id: cityId,
            });
            if (response.rows && response.rows.length === 0) {
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

    let response = await database.get(
        tables.USER_CITYUSER_MAPPING_TABLE,
        { userId: req.userId, cityId },
        "cityUserId"
    );

    // The current user might not be in the city db
    const cityUserId =
    response.rows && response.rows.length > 0
        ? response.rows[0].cityUserId
        : null;

    response = await database.get(
        tables.LISTINGS_TABLE,
        { id: listingId },
        null,
        cityId
    );
    if (!response.rows || response.rows.length === 0) {
        return next(
            new AppError(`Listing with id ${listingId} does not exist`, 404)
        );
    }
    const currentListingData = response.rows[0];

    if (currentListingData.userId !== cityUserId && req.roleId !== roles.Admin) {
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

    const arrayOfAllowedFiles = ["pdf"];
    const arrayOfAllowedFileTypes = ["application/pdf"];

    const fileExtension = pdf.name.slice(
        ((pdf.name.lastIndexOf(".") - 1) >>> 0) + 2
    );

    if (
        !arrayOfAllowedFiles.includes(fileExtension) ||
    !arrayOfAllowedFileTypes.includes(pdf.mimetype)
    ) {
        return next(new AppError(`Invalid Pdf type`, 403));
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

            await database.update(
                tables.LISTINGS_TABLE,
                updationData,
                { id: listingId },
                cityId
            );

            return res.status(200).json({
                status: "success",
            });
        } else {
            return next(new AppError("pdf Upload failed"));
        }
    } catch (err) {
        return next(new AppError(err));
    }
});

router.delete(
    "/:id/imageDelete",
    authentication,
    async function (req, res, next) {
        const id = req.params.id;
        const cityId = req.cityId;

        if (!cityId) {
            return next(new AppError(`City is not present`, 404));
        } else {
            try {
                const response = await database.get(tables.CITIES_TABLE, {
                    id: cityId,
                });
                if (response.rows && response.rows.length === 0) {
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

        let response = await database.get(
            tables.USER_CITYUSER_MAPPING_TABLE,
            { userId: req.userId, cityId },
            "cityUserId"
        );

        // The current user might not be in the city db
        const cityUserId =
      response.rows && response.rows.length > 0
          ? response.rows[0].cityUserId
          : null;

        response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);

        if (!response.rows || response.rows.length === 0) {
            return next(new AppError(`Listing with id ${id} does not exist`, 404));
        }
        const currentListingData = response.rows[0];

        if (
            currentListingData.userId !== cityUserId &&
      req.roleId !== roles.Admin
        ) {
            return next(
                new AppError(`You are not allowed to access this resource`, 403)
            );
        }

        let imageList = await axios.get(
            "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST
        );
        imageList = JSON.parse(
            parser.xml2json(imageList.data, { compact: true, spaces: 4 })
        );
        const userImageList = imageList.ListBucketResult.Contents.filter((obj) =>
            obj.Key._text.includes(`user_${req.userId}/city_${cityId}_listing_${id}`)
        );
        try {
            const onSucccess = async () => {
                await database.deleteData(
                    tables.LISTINGS_IMAGES_TABLE,
                    { listingId: id },
                    cityId
                );
                return res.status(200).json({
                    status: "success",
                });
            };
            const onFail = (err) => {
                return next(
                    new AppError("Image Delete failed with Error Code: " + err)
                );
            };
            await imageDeleteMultiple(
                userImageList.map((image) => ({ Key: image.Key._text })),
                onSucccess,
                onFail
            );
        } catch (err) {
            return next(new AppError(err));
        }
    }
);

router.delete(
    "/:id/pdfDelete",
    authentication,
    async function (req, res, next) {
        const id = req.params.id;
        const cityId = req.cityId;

        if (!cityId) {
            return next(new AppError(`City is not present`, 404));
        } else {
            try {
                const response = await database.get(tables.CITIES_TABLE, {
                    id: cityId,
                });
                if (response.rows && response.rows.length === 0) {
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

        let response = await database.get(
            tables.USER_CITYUSER_MAPPING_TABLE,
            { userId: req.userId, cityId },
            "cityUserId"
        );

        // The current user might not be in the city db
        const cityUserId =
      response.rows && response.rows.length > 0
          ? response.rows[0].cityUserId
          : null;

        response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);
        if (!response.rows || response.rows.length === 0) {
            return next(new AppError(`Listing with id ${id} does not exist`, 404));
        }
        const currentListingData = response.rows[0];

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

                await database.update(
                    tables.LISTINGS_TABLE,
                    updationData,
                    { id },
                    cityId
                );
                return res.status(200).json({
                    status: "success",
                });
            };
            const onFail = (err) => {
                return next(new AppError("Pdf Delete failed with Error Code: " + err));
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
);

module.exports = router;
