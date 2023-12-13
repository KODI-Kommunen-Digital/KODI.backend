const getCategoriesListingCountSwagger = {
    summary: "Get all categories listing count",
    description: "Retrieve all categories listing count from the database",
    tags: ["Categories"],
    parameters: [
        {
            in: "query",
            name: "cityId",
            schema: {
                type: "integer",
                minimum: 1,
            },
            description: "The city ID for which the listing count is to be fetched",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the listing count",
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
                                            example: 1
                                        },
                                        count: {
                                            type: "integer",
                                            example: 1,
                                            required: false,
                                        },
                                        totalCount: {
                                            type: "integer",
                                            example: 15,
                                            reqired: false,
                                        },
                                    },
                                }
                            },
                        },
                    },
                },
            }
        },
        404: {
            description: "Invalid cityId given",
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
