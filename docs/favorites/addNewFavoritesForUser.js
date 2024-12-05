const createFavoriteListingSwagger = {
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
            description: "ID of the user to add favorites for",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
        },
    ],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        listingId: {
                            type: "integer",
                            example: 1,
                        },
                        cityId: {
                            type: "integer",
                            example: 1,
                        },
                    },
                },
            },
        },
    },
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
                            id: {
                                type: "integer",
                                example: 1,
                            }
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
        401: {
            description: "Unauthorized",
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
                                example: "Authorization token not present",
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

module.exports = createFavoriteListingSwagger;
