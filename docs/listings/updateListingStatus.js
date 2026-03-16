const updateListingStatuschemaSwagger = {
    summary: "Change status of a listing",
    tags: ['Listings'],
    description: "Change status of a listing",
    security: [
        {
            bearerAuth: [],
        },
    ],
    parameters: [
        {
            in: "path",
            name: "id",
            required: true,
            description: "The ID of the listing",
            schema: {
                type: "integer",
            },
        },
    ],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: {
                    properties: {
                        status: {
                            type: "integer",
                            required: true,
                            description: "The listing id",
                            example: 1,
                        }
                    },
                },
            },
        }
    },
    responses: {
        200: {
            description: "Listing status updated",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: "Invalid token or token expired",
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
            description: "Forbidden access",
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
            description: "Listing not found",
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
                                example: "Listing with id 100 does not exist",
                            },
                        },
                    },
                },
            },
        },
        500: {
            description: "Internal server error",
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

module.exports = updateListingStatuschemaSwagger;