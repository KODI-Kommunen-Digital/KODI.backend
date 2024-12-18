const { UserCityListing } = require("../models/cityListing");

const getMyListingsSwagger = {
    summary: "Get my listings",
    description: "Fetches listings associated with my user, optionally filtered by category, status, and subcategory",
    tags: ["Listings"],
    parameters: [
        {
            in: "query",
            name: "pageNo",
            schema: {
                type: "integer",
                default: 1,
            },
            required: false,
            description: "Page number of the listings result",
        },
        {
            in: "query",
            name: "pageSize",
            schema: {
                type: "integer",
                default: 9,
            },
            required: false,
            description: "Number of listings per page",
        },
        {
            in: "query",
            name: "categoryId",
            schema: {
                type: "integer",
            },
            required: false,
            description: "Filter listings by category ID",
        },
        {
            in: "query",
            name: "statusId",
            schema: {
                type: "integer",
            },
            required: false,
            description: "Filter listings by status ID",
        },
        {
            in: "query",
            name: "subcategoryId",
            schema: {
                type: "integer",
            },
            required: false,
            description: "Filter listings by subcategory ID",
        }
    ],
    responses: {
        "200": {
            description: "Listings fetched successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                                description: "The status of the response",
                            },
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: UserCityListing,
                                },
                            },
                        },
                    },
                },
            },
        },
        "400": {
            description: "Invalid input given",
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
                                example: "Invalid page number",
                            },
                        },
                    },
                },
            },
        },
        "401": {
            description: "Unauthorized access",
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
                                example: "Authentication token is missing or invalid",
                            },
                        },
                    },
                },
            },
        },
        "500": {
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
                                example: "Server error occurred",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getMyListingsSwagger;
