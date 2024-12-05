const { CityListing } = require("../models/cityListing");

const createCityListingSwagger = {
    summary: "Create a new listing",
    description: "Allows users to create a new listing in a specified city.",
    tags: ["City Listings"],
    parameters: [
        {
            in: "path",
            name: "cityId",
            required: true,
            schema: {
                type: "integer",
                required: true,
                description: "The city id",
                example: 1,
            },
        },
    ],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: CityListing
            },
        },
    },
    responses: {
        200: {
            description: "Listing created successfully",
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
                                example: 12345,
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Invalid City ID or missing required fields",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                example: "Invalid City '0' given",
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
                            message: {
                                type: "string",
                                example: "Error creating listing",
                            },
                        },
                    },
                },
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};

module.exports = createCityListingSwagger;