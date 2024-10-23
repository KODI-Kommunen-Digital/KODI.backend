const getCategoriesListingCountSwagger = {
    summary: "Get listings count by category",
    description: `
      Retrieve the count of listings per category. If a \`cityId\` is provided, it fetches listings count specific to that city. 
      If no \`cityId\` is given, it aggregates the listings count from all available cities.
    `,
    tags: ["Categories"],
    parameters: [
        {
            in: "query",
            name: "cityId",
            schema: {
                type: "integer",
                example: 1,
            },
            required: false,
            description: "ID of the city to fetch the listings count for. If not provided, it will aggregate across all cities.",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the listings count",
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
                                        categoryId: {
                                            type: "integer",
                                            example: 2,
                                        },
                                        count: {
                                            type: "integer",
                                            example: 150,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Bad Request",
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
                                example: "Invalid request data",
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: "City not found",
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
                                example: "Invalid City '1' given",
                            },
                        },
                    },
                },
            },
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

module.exports = getCategoriesListingCountSwagger;
