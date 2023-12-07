const status = require("../constants/status");
const source = require("../constants/source");
const categories = require("../constants/categories");
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const getDateInFormate = require("../utils/getDateInFormate")
const subcategories = require("../constants/subcategories");
const roles = require("../constants/roles");

const createCityListing = async function (req, res, next) {
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
                return next(
                    new AppError(`Invalid City '${cityId}' given`, 400)
                );
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
                    new AppError(
                        `Invalid Village id '${payload.villageId}' given`,
                        400
                    )
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
                    new AppError(
                        `Invalid Category '${payload.categoryId}' given`,
                        400
                    )
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
                        new AppError(
                            `Invalid Status '${payload.statusId}' given`,
                            400
                        )
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
                response = await database.create(
                    tables.USER_TABLE,
                    user,
                    cityId
                );

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
}

module.exports = {
    createCityListing,
}