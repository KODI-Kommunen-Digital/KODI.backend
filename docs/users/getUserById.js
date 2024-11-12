const { UserResponseSchema } = require("../models/userModels");

const getUserByIdDoc = {
    summary: "Get a user by ID",
    description: "Retrieve a user based on their ID",
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
            name: "cityUser",
            schema: {
                type: "boolean",
            },
            required: false,
            description:
                "If true, the user will be checked against cityId and returned with cityUser mappings",
        },
        {
            in: "query",
            name: "cityId",
            schema: {
                type: "integer",
            },
            required: false,
            description:
                "The ID of the city; if given, will return the user with cityUser mapping for the specified city",
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
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: UserResponseSchema,
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

module.exports = getUserByIdDoc;
