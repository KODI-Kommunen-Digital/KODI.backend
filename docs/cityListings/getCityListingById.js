const { CityListing } = require("../models/cityListing");

const getCityListingByIdSwagger = {
    tags: ["City Listings"],
    summary: "Get a particular listing of a city",
    description: "Get a city listing by id",
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
        {
            in: "path",
            name: "id",
            schema: {
                type: "integer",
                required: true,
                description: "The listing id",
                example: 1,
            },
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the listing",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                            },
                            data: CityListing,
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
                                example: "invalid cityId given",
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
                                example: "Listings with id 1 does not exist",
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

module.exports = getCityListingByIdSwagger;