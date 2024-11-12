const { CityListing } = require("../models/cityListing");

const getSearchListingsSwagger = {
    summary: "Search listings",
    description: "Search and retrieve listings based on query, filters, and pagination.",
    tags: ["Listings"],
    parameters: [
        {
            in: "query",
            name: "pageNo",
            schema: {
                type: "integer",
                minimum: 1,
            },
            description: "The page number for pagination (must be a positive integer).",
        },
        {
            in: "query",
            name: "pageSize",
            schema: {
                type: "integer",
                minimum: 1,
                maximum: 20,
            },
            description: "The number of listings per page (positive integer, maximum 20).",
        },
        {
            in: "query",
            name: "searchQuery",
            schema: {
                type: "string",
            },
            description: "The search term to filter listings by title or description.",
        },
        {
            in: "query",
            name: "cityId",
            schema: {
                type: "string",
            },
            description: "The ID of the city to filter the listings. If not provided, all cities are searched.",
        },
        {
            in: "query",
            name: "sortByStartDate",
            schema: {
                type: "boolean",
            },
            description: "Whether to sort the listings by start date. Default is to sort by creation date.",
        },
        {
            in: "query",
            name: "statusId",
            schema: {
                type: "string",
            },
            description: "The ID of the listing status to filter the results.",
        }
    ],
    responses: {
        200: {
            description: "Successfully fetched the listings",
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
                                items: CityListing
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Invalid input for query parameters",
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
                                example: "Please enter a positive integer for pageNo",
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: "Invalid cityId provided",
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
                                example: "Invalid City '999' given",
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
                                example: "An error occurred while fetching listings: Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getSearchListingsSwagger;
