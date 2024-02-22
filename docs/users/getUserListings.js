const { UserCityListing } = require("../models/cityListing");
const getUserListings = {
    summary: "Get user listings",
    description: "Get all the city lisitngs related to user",
    'tags': ["Users"],
    parameters: [
        {
            in: "path",
            name: "id",
            schema: {
                type: "integer",
            },
            required: true,
            description: "The ID of the user",
            title: "get used by Id",
        },
        {
            in: "query",
            name: "pageNo",
            schema: {
                type: "integer",
            },
            required: false,
            description: "page number",
            default: 1,
        },
        {
            in: "query",
            name: "pageSize",
            schema: {
                type: "integer",
            },
            required: false,
            description: "no. of records per page",
            default: 9,
        },
        {
            in: "query",
            name: "statusId",
            schema: {
                type: "string",
            },
            description: "filter according to the statusId",
        },
        {
            in: "query",
            name: "categoryId",
            schema: {
                type: "string",
            },
            description: "filter according to the categoryId",
        },
        {
            in: "query",
            name: "subcategoryId",
            schema: {
                type: "string",
            },
            description: "filter according to the subcategoryId",
        },
    ],
    responses: {
        "200": {
            description: "The user was successfully fetched",
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
                            data: UserCityListing,
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
                                example: "User with id 20 does not exist",
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
                                example: "ReferenceError data is not defined",
                            },
                        },
                    },
                },
            },
        },
    },

};

module.exports = getUserListings;
