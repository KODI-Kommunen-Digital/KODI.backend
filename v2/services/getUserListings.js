const AppError = require("../utils/appError");
const statusRepository = require("../repository/statusRepo");
const categoriesRepository = require("../repository/categoriesRepo");
const listingsRepository = require("../repository/listingsRepo");

// to refactor
async function getUserListings(userId, statusId, categoryId, subcategoryId, pageNo, pageSize) {

    const filters = {};

    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        throw new AppError(`Invalid UserId ${userId}`, 400);
    }
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

    if (statusId) {
        // check status id is valid or not before passing it into the query
        if (isNaN(Number(statusId)) || Number(statusId) <= 0) {
            throw new AppError(`Invalid status ${statusId}`, 400);
        }

        try {
            const statuses = await statusRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: statusId,
                    }
                ],
                columns: ["count(id) as statusCount"],
            });
            if (statuses.statusCount === 0) {
                throw new AppError(`Invalid Status '${statusId}' given`, 400);
            }
        } catch (err) {
            throw new AppError(err);
        }
        filters.statusId = statusId;
    }

    if (categoryId) {
        // check category id is valid or not before passing it into the query
        if (isNaN(Number(categoryId)) || Number(categoryId) <= 0) {
            throw new AppError(`Invalid category ${categoryId}`, 400);
        }

        try {
            const categories = await categoriesRepository.getAll({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: categoryId,
                    },
                    {
                        key: "isEnabled",
                        sign: "=",
                        value: true,
                    }
                ],
            });
            if (categories.count === 0) {
                throw new AppError(`Invalid Category '${categoryId}' given`, 400);
            } else {
                if (subcategoryId) {
                    // check subcategory id is valid or not before passing it into the query
                    if (isNaN(Number(subcategoryId)) || Number(subcategoryId) <= 0) {
                        throw new AppError(`Invalid subcategory ${subcategoryId}`, 400);
                    }

                    try {
                        const subcategories = await categoriesRepository.getOne({
                            filters: [
                                {
                                    key: "categoryId",
                                    sign: "=",
                                    value: categoryId,
                                },
                                {
                                    key: "id",
                                    sign: "=",
                                    value: subcategoryId,
                                }
                            ],
                            columns: ["count(id) as subcategoryCount"],
                        });
                        if (subcategories.subcategoryCount === 0) {
                            throw new AppError(
                                `Invalid subCategory '${subcategoryId}' given`,
                                400,
                            );
                        }
                    } catch (err) {
                        throw new AppError(err);
                    }
                    filters.subcategoryId = subcategoryId;
                }
            }
        } catch (err) {
            throw new AppError(err);
        }
        filters.categoryId = categoryId;
    }

    filters.userId = userId;
    try {
        return await listingsRepository.retrieveListings({filters, pageNo, pageSize});
    } catch (err) {
        throw new AppError(err);
    }
}

module.exports = { getUserListings };
