const getFavoritesSwagger = {
    summary: "Get all favorites for user",
    description: "Retrieve all favorites for user from the database",
    tags: ["Favorites"],
    security: [
        {
            bearerAuth: [],
        },
    ],
    parameters: [
        {
            name: "userId",
            in: "path",
            description: "ID of the user to retrieve favorites for",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the favorites of the user from the database",
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
                                        userId: {
                                            type: "integer",
                                            example: 19,
                                        },
                                        cityId: {
                                            type: "integer",
                                            example: 2,
                                        },
                                        listingId: {
                                            type: "integer",
                                            example: 4,
                                        }
                                    },
                                }
                            },
                        },
                    },
                },
            }
        },
        400: {
            description: "Invalid request data",
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
                                example: "Invalid userId 1",
                            },
                        },
                    },
                },
            },
        },
        403: {
            description: "Forbidden",
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
                                example: "You are not allowed to access this resource",
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

module.exports = getFavoritesSwagger;
