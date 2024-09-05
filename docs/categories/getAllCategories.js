
const {Category} = require("../models/Category");

const getAllCategoriesSwagger = {
    summary: "Get all categories",
    description: "Retrieve all categories from the database",
    tags: ["Categories"],
    responses: {
        200: {
            description: "Successfully fetched the categories",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                            },
                            data: {
                                type: "array",
                                items: Category,
                            },
                        },
                    },
                },
            }
        },
        500: {
            description: "Internal Server Error",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                                example: "Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getAllCategoriesSwagger;
