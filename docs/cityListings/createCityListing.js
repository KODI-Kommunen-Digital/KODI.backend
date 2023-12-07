const CityListing = require("../models/cityListing");

const createCityListingSwagger = {
    summary: "Create a new listing",
    tags: ["City Listings"],
    description: "Create a new listing in the given city",
    security: [
        {
            bearerAuth: [],
        },
    ],
    parameters: [
        {
            in: "path",
            name: "cityId",
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
                schema: CityListing,
            },
        },
    },
    responses: {
        200: {
            description: "The listing was successfully created",
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
                            },
                        },
                    },
                },
            },
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
                                example: "Invalid Village id '2' given",
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

module.exports = createCityListingSwagger;