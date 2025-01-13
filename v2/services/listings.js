const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const deepl = require("deepl-node");
const listingImagesRepository = require("../repository/listingsImagesRepo");
const pollRepository = require("../repository/pollOptionsRepo");
const listingRepository = require("../repository/listingsRepo");
const cityRepository = require("../repository/citiesRepo");
const statusRepository = require("../repository/statusRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const subcategoriesRepository = require("../repository/subcategoriesRepo");
const cityListingMappingRepo = require("../repository/cityListingMappingRepo");
const listingFunctions = require("../services/listingFunctions");
const status = require("../constants/status");
const source = require("../constants/source");
const imageUpload = require("../utils/imageUpload");
const getPdfImage = require("../utils/getPdfImage");
const pdfUpload = require("../utils/pdfUpload");
const imageDeleteAsync = require("../utils/imageDeleteAsync");
const axios = require("axios");
const parser = require("xml-js");
const roles = require("../constants/roles");
const categories = require("../constants/categories");
const defaultImageCount = require("../constants/defaultImagesInBucketCount");
const DEFAULTIMAGE = "Defaultimage";
const bucketClient = require("../utils/bucketClient");

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

    if (isAdmin) {
        if (statusId) {
            // const response = await cityListingRepo.getStatusById(statusId);
            const response = await statusRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: statusId
                    }
                ]
            }); // removing the cityId
            if (!response) {
                throw new AppError(`Invalid Status '${statusId}' given`, 400);
            }
            // filters.statusId = statusId;
            filters.push({
                key: "statusId",
                sign: "=",
                value: statusId
            });
        }
    } else {
        // filters.statusId = status.Active;
        filters.push({
            key: "statusId",
            sign: "=",
            value: status.Active
        });
    }

    if (categoryId) {
        // const category = await cityListingRepo.getCategoryById(categoryId);
        const categoryResp = await categoriesRepository.getAll({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: categoryId
                },
                {
                    key: "isEnabled",
                    sign: "=",
                    value: true,
                       
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
            // filters.subcategoryId = subcategoryId;
            filters.push({
                key: "subcategoryId",
                sign: "=",
                value: subcategoryId
            });
        }
        // filters.categoryId = categoryId;
        filters.push({
            key: "categoryId",
            sign: "=",
            value: categoryId
        });
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
        if (!citiesResp.count) {
            throw new AppError(`No cities found for provided CityId(s) '${cityId}'`, 400);
        }

        // Check if the number of cities retrieved matches the number of IDs provided
        if (citiesResp.count !== cityIds.length) {
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
        cities = citiesResp?.rows?.map(city => city.id) ?? [];
    }

    if (showExternalListings !== "true") {
        // filters.sourceId = source.UserEntry;
        filters.push({
            key: "sourceId",
            sign: "=",
            value: source.UserEntry
        });
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
        if (cities.count === 0) {
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
        // filters.statusId = statusId;
        filters.push({
            key: "statusId",
            sign: "=",
            value: statusId
        });
    } else {
        // filters.statusId = status.Active;
        filters.push({
            key: "statusId",
            sign: "=",
            value: status.Active
        });
    }

    try {
        const listings = await listingRepository.retrieveListings({
            filters,
            cities: cities.map(city => city.id),
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
        const createdListings = await listingFunctions.createListing(cityIds, listingData, userId, roleId);
        return createdListings;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error creating listing: ${err.message}`);
    }
};

const updateListing = async ({ listingId, cityIds, listingData, userId, roleId }) => {
    try {
        const updatedListing = await listingFunctions.updateListing(listingId, cityIds, listingData, userId, roleId);
        return updatedListing;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Error updating listing: ${err.message}`);
    }
}

const getListingWithId = async function (
    id,
    repeatedRequest = false,
) {
    try {

        // const data = await listingRepo.getCityListingWithId(id, cityId);
        const data = await listingRepository.getOne({
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ]
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
            ]
        });

        const allCities = cityListingMappings.rows.map(cityListingMapping => cityListingMapping.cityId)

        data.allCities = allCities
        data.cityId = allCities.length > 0 ? allCities[0] : null;

        const listingImageListResp = await listingImagesRepository.getAll({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ]
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
                ]
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
                ]
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

const deleteListing = async function (id, userId, roleId) {

    const currentListingData = await listingRepository.getOne({
        filters: [
            {
                key: "id",
                sign: "=",
                value: id,
            },
        ]
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }


    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    try {
        const userImageList = await bucketClient.fetchUserImages(userId, null, id);

        const imagesToDelete = userImageList.map((image) => ({ Key: image.Key._text })).filter((image) => image && !image.startsWith("admin/"))

        if (imagesToDelete && imagesToDelete.length > 0) {
            await imageDeleteAsync.deleteMultiple(imagesToDelete);
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
        await listingRepository.delete({
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
        ]
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    if (currentListingData.pdf && currentListingData.pdf.length > 0) {
        throw new AppError(
            `Pdf is present in listing So can not upload image.`,
            403,
        );
    }

    const imageArr = imageFiles ? (imageFiles.length > 1 ? imageFiles : [imageFiles]) : [];
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
        ]
    });
    const listingImages = listingImagesResp.rows;
    if (listingImages && listingImages.length > 0 && listingImages[0].logo.startsWith("admin/")) {
        // await cityListingRepo.deleteListingImage(listingId, cityId);
        await listingImagesRepository.delete({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: listingId,
                },
            ]
        });
    } else {
        const imagesToRetain = listingImages.filter((value) =>
            (imageList || []).includes(value.logo),
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
                ]
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
                    ]
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
                    }
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

const uploadPDF = async function (
    listingId,
    userId,
    roleId,
    pdf,
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
        ]
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${listingId} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
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
        ]
    });
    const imagesToDelete = imagesToDeleteResp.rows;
    if (imagesToDelete && imagesToDelete.length > 0) {
        await imageDeleteAsync.deleteMultiple(
            imagesToDelete.map((i) => i.logo).filter((i) => !i.startsWith("admin/")),
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
            ]
        });
    }

    try {
        const filePath = `user_${userId}/listing_${listingId}_${Date.now()}_PDF.pdf`;
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
            const imagePath = `user_${userId}/listing_${listingId}_${imageOrder}`;
            const pdfImageBuffer = await getPdfImage(pdfFilePath);
            const { uploadStatus, objectKey } = await imageUpload(
                pdfImageBuffer,
                imagePath,
            );

            if (uploadStatus === "Success") {
                await listingImagesRepository.create({
                    data: {
                        listingId,
                        imageOrder,
                        logo: objectKey,
                    }
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
                ]
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
        ]
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    // todo: move this to a separate layer
    let imageList = await axios.get(
        "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST,
    );
    imageList = JSON.parse(
        parser.xml2json(imageList.data, { compact: true, spaces: 4 }),
    );

    const userListingFilter = `user_${userId}/listing_${id}`;
    const userImageList = imageList.ListBucketResult.Contents.filter((obj) =>
        obj.Key._text.includes(userListingFilter),
    ).filter((obj) => !obj.Key._text.includes("admin/"));

    const imagesToDelete = userImageList.map((image) => ({ Key: image.Key._text }))

    try {
        if (imagesToDelete && imagesToDelete.length > 0) {
            await imageDeleteAsync.deleteMultiple(
                imagesToDelete.map((i) => i.Key),
            );
        }

        await listingImagesRepository.delete({
            filters: [
                {
                    key: "listingId",
                    sign: "=",
                    value: id,
                },
            ]
        });
        await addDefaultImage(id, currentListingData.categoryId);
    } catch (err) {
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
        ]
    });
    if (!currentListingData) {
        throw new AppError(`Listing with id ${id} does not exist`, 404);
    }

    if (currentListingData.userId !== userId && roleId !== roles.Admin) {
        throw new AppError(`You are not allowed to access this resource`, 403);
    }

    try {
        if (currentListingData.pdf) {
            await imageDeleteAsync.deleteImage(currentListingData.pdf)
        }

        const updationData = {
            pdf: ""
        };

        await listingRepository.update({
            data: updationData,
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: id,
                },
            ]
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

async function addDefaultImage(listingId, categoryId) {
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
        }
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
        ]
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
        ]
    });
    const pollOptions = pollOptionsResp?.rows ?? [];
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

        // await pollRepo.updatePollOptionVotes(optionId, voteCount, cityId);
        await pollRepository.update({
            data: { votes: voteCount },
            filters: [
                {
                    key: "id",
                    sign: "=",
                    value: optionId,
                },
            ]
        });
        return voteCount;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    getAllListings,
    searchListings,
    createListing,
    deleteListing,
    updateListing,
    getListingWithId,
    uploadImage,
    uploadPDF,
    deleteImage,
    deletePDF,
    vote
};
