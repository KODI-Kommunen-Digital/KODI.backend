const getSubCategoriesSwagger = {
    summary: "Get all subcategories for a category",
    description: "Retrieve all subcategories for a category from the database",
    tags: ["Categories"],
    parameters: [
        {
            in: "path",
            name: "id",
            schema: {
                type: "integer"
            },
            description: "The category ID for which the subcategories are to be fetched",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the subcategories",
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
                                items: {
                                    type: "object",
                                    properties: {
                                        id: {
                                            type: "integer",
                                            example: 1,
                                        },
                                        categoryId: {
                                            type: "integer",
                                            example: 1
                                        },
                                        name: {
                                            type: "string",
                                            example: "FlashNews",
                                        },
                                    },
                                }
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

module.exports = getSubCategoriesSwagger;
