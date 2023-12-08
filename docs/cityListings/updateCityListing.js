const { UpdateCityListing } = require("../models/cityListing");

const updateCityListingSwagger = {
    summary: "Update a listing of a city",
    tags: ["City Listings"],
    description: "Edit a particular listing of a city",
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
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: UpdateCityListing,
            },
        },
    },
    responses: {
        200: {
            description: "The listing was successfully updated",
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
        403: {
            description: "Invalid auth",
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
                                example: "You dont have access to change this option",
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

module.exports = updateCityListingSwagger;