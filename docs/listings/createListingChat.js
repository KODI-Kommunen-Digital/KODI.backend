const createListingChatSwagger = {
    summary: "Create a new chat message for a listing",
    tags: ['Listings'],
    description: "Send a new message to the chat associated with a specific listing.",
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
            description: "The ID of the listing to send a chat message to",
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
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "The chat message to be sent",
                            example: "Hello, I would like to know more about the listing.",
                        },
                    },
                    required: ["message"],
                },
            },
        },
    },
    responses: {
        200: {
            description: "Message sent successfully",
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
                                type: "object",
                                properties: {
                                    id: {
                                        type: "integer",
                                        example: 123,
                                    },
                                    listingId: {
                                        type: "integer",
                                        example: 1,
                                    },
                                    senderId: {
                                        type: "integer",
                                        example: 42,
                                    },
                                    senderType: {
                                        type: "string",
                                        enum: ["user", "admin"],
                                        example: "user",
                                    },
                                    message: {
                                        type: "string",
                                        example: "Hello, I would like to know more about the listing.",
                                    },
                                    timestamp: {
                                        type: "string",
                                        format: "date-time",
                                        example: "2025-05-19T12:34:56Z",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Bad request - Missing or invalid message",
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
                                example: "Message content cannot be empty",
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: "Unauthorized - Invalid token or token expired",
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
            description: "Forbidden - User does not have permission",
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

module.exports = createListingChatSwagger;
