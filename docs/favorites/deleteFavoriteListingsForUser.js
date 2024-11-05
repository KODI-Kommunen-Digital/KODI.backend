const deleteFavoriteListingSwagger = {
    summary: "Delete a favorite listings for user",
    description: "Delete a favorite listings for user based on the favorite id from request path",
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
            description: "ID of the user to delete favorite listings",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
        },
        {
            name: "id",
            in: "path",
            description: "ID of the favorite listing to delete",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
        },
    ],
    responses: {
        200: {
            description: "Successfully deleted the favorite listings of the user from the database",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
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
        404: {
            description: "Favorite listing with the given id does not exist",
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
                                example: "Favorites with id 1 does not exist",
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

module.exports = deleteFavoriteListingSwagger;
