const { FavoriteCityListing } = require("../models/cityListing");

const getFavoriteListingsSwagger = {
    summary: "Get all favorite listings for user",
    description: "Retrieve all favorite listings for user from the database",
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
            description: "ID of the user to retrieve favorite listings for ",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the favorite listings of the user from the database",
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
                                items: FavoriteCityListing
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

module.exports = getFavoriteListingsSwagger;
