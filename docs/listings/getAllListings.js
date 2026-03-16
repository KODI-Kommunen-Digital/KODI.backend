const { CityListing } = require("../models/cityListing");

const getAllListingsSwagger = {
    summary: "Get all listings",
    description: "Retrieve all listings based on the provided parameters",
    tags: ["Listings"],
    security: [
        {
            bearerAuth: [],
        },
    ],
    parameters: [
        {
            in: "query",
            name: "pageNo",
            schema: {
                type: "integer",
                minimum: 1,
            },
            description: "The page number for pagination",
        },
        {
            in: "query",
            name: "pageSize",
            schema: {
                type: "integer",
                minimum: 1,
                maximum: 20,
            },
            description: "The number of listings per page",
        },
        {
            in: "query",
            name: "sortByStartDate",
            schema: {
                type: "boolean",
            },
            description: "Sort the listings by start date",
        },
        {
            in: "query",
            name: "statusId",
            schema: {
                type: "string",
            },
            description: "The ID of the status",
        },
        {
            in: "query",
            name: "categoryId",
            schema: {
                type: "string",
            },
            description: "The ID of the category",
        },
        {
            in: "query",
            name: "subcategoryId",
            schema: {
                type: "string",
            },
            description: "The ID of the subcategory",
        },
        {
            in: "query",
            name: "cityId",
            schema: {
                type: "string",
            },
            description: "The ID of the city",
        },
        {
            in: "query",
            name: "translate",
            schema: {
                type: "string",
            },
            description: "To translate the listing into the given language",
        },
        {
            in: "query",
            name: "startAfterDate",
            schema: {
                type: "string",
                required: false,
                description: "To get Listings from specific Date formate: (YYYY-MM-DD)",
                example: '2024-12-03',
            },
        },
        {
            in: "query",
            name: "endBeforeDate",
            schema: {
                type: "string",
                required: false,
                description: "To get Listings till specific Date formate: (YYYY-MM-DD)",
                example: '2024-12-03',
            },
        },
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
                                items: CityListing,
                            },
                        },
                    },
                },
            }
        },
        400: {
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
                                example: "Please enter a positive integer for pageNo",
                            },
                        },
                    },
                },
            },
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

module.exports = getAllListingsSwagger;
