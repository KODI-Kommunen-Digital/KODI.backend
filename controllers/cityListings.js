const status = require("../constants/status");
const source = require("../constants/source");
const categories = require("../constants/categories");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate")
const database = require("../services/database");
const tables = require("../constants/tableNames");
const subcategories = require("../constants/subcategories");
const roles = require("../constants/roles");
const userServices = require("../services/users");
const cityServices = require("../services/cities");
const cityListingServices = require("../services/cityListing");
const listingService = require("../services/listingService");

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
                insertionData.endDate = getDateInFormate(
                    new Date(payload.endDate)
                );
                insertionData.expiryDate = getDateInFormate(new Date(new Date(payload.endDate).getTime() + 1000 * 60 * 60 * 24));
            }
            if (parseInt(payload.categoryId) === categories.News) {
                insertionData.expiryDate = getDateInFormate(
                    new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 15)
                );
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
                return next(
                    new AppError(`Invalid City '${cityId}' given`, 404)
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(tables.LISTINGS_TABLE, { id }, null, cityId)
        .then((response) => {
            const data = response.rows;
            if (!data || data.length === 0) {
                return next(
                    new AppError(`Listings with id ${id} does not exist`, 404)
                );
            }
            res.status(200).json({
                status: "success",
                data: data[0],
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
}


module.exports = {
    createCityListing,
    getCityListingWithId,
}