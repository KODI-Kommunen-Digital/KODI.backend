const getSubCategoriesSwagger = {
    summary: "Get all subcategories for a category",
    description: "Retrieve all subcategories for a specific category from the database using the category ID.",
    tags: ["Categories"],
    parameters: [
        {
            in: "path",
            name: "id",
            required: true, 
            schema: {
                type: "integer",
                example: 1, 
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
                                        name: {
                                            type: "string",
                                            example: "FlashNews",
                                        },
                                        categoryId: {
                                            type: "integer",
                                            example: 1,
                                        },
                                    },
                                },
                                example: [
                                    {
                                        id: 1,
                                        categoryId: 1,
                                        name: "FlashNews"
                                    },
                                    {
                                        id: 2,
                                        categoryId: 1,
                                        name: "BreakingNews"
                                    }
                                ]
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
