const CityListing = require("../models/cityListing");

const getAllCityListingsSwagger = {
    tags: ["City Listings"],
    summary: "Get all the listings of a city",
    description: "Get all listings of a city",
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
            in: "query",
            name: "pageNo",
            schema: {
                type: "integer",
                required: false,
                description: "pagination default value is 1, and it should be greater than 0",
                example: 1,
            },
        },
        {
            in: "query",
            name: "pageSize",
            schema: {
                type: "integer",
                required: false,
                description: "It is the number of listings you want to see in a one-page default value is 9, and it should be greater than 0 and less than 20,",
                example: 10,
            },
        },
        {
            in: "query",
            name: "statusId",
            schema: {
                type: "integer",
                required: false,
                description: "When a listing is created, the status is given. Active, pending, and inactive",
                example: 1,
            },
        },
        {
            in: "query",
            name: "categoryId",
            schema: {
                type: "integer",
                required: false,
                description: "With the help of Id, we can get to know which category a listing belongs to",
                example: 1,
            },
        },
        {
            in: "query",
            name: "subcategoryId",
            schema: {
                type: "integer",
                required: false,
                description: "The subcategory id",
                example: 1,
            },
        },
        {
            in: "query",
            name: "userId",
            schema: {
                type: "integer",
                required: false,
                description: "To know who is the user",
                example: 1,
            },
        },
        {
            in: "query",
            name: "translate",
            schema: {
                type: "string",
                required: false,
                description: "To translate the listing into the given language",
                example: 'de',
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
                                example: "invalid cityId given",
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: "invalid cityId given",
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

module.exports = getAllCityListingsSwagger;