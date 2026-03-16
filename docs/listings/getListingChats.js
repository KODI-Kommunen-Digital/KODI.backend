const getListingChatSwagger = {
    summary: "Get chat messages for a specific listing",
    tags: ['Listings'],
    description: "Retrieve chat messages associated with a listing, optionally filtered by last message ID and ordered.",
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
            description: "The ID of the listing to fetch chat messages for",
            schema: {
                type: "integer",
            },
        },
        {
            in: "query",
            name: "lastMessageId",
            required: false,
            description: "The ID of the last message retrieved (for pagination)",
            schema: {
                type: "integer",
            },
        },
        {
            in: "query",
            name: "pageNo",
            required: false,
            description: "The page number for paginated results",
            schema: {
                type: "integer",
                default: 1,
            },
        },
        {
            in: "query",
            name: "pageSize",
            required: false,
            description: "Number of chat messages per page",
            schema: {
                type: "integer",
                default: 10,
            },
        },
        {
            in: "query",
            name: "isReversed",
            required: false,
            description: "Whether to retrieve messages in reversed order (newest first)",
            schema: {
                type: "boolean",
                default: true,
            },
        },
    ],
    responses: {
        200: {
            description: "Chat messages retrieved successfully",
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
                                            example: "Hello, how can I help you?",
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

module.exports = getListingChatSwagger;
