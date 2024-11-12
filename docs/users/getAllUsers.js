const { UserResponseSchema } = require("../models/userModels");

const getAllUsersSwagger = {
    summary: "Get all users",
    description:
        "Get all the users or a list of users based on the query params. Can be used to get a list of users based on their ids or username. If you want to get a list of users based on their ids, send the ids as a comma separated string in the query param 'ids'. If you want to get the users based on their username, send the username as a string in the query param 'username'.",
    tags: ["Users"],
    parameters: [
        {
            in: "query",
            name: "ids",
            schema: {
                type: "string",
                example: "1,2,3",
            },
        },
        {
            in: "query",
            name: "username",
            schema: {
                type: "string",
                example: "johndoe",
            },
        },
    ],
    responses: {
        "200": {
            description: "The users were successfully fetched",
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
                                example: "You can only fetch upto 10 users",
                            },
                        },
                    },
                },
            },
        },
        "500": {
            description: "Server error",
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
                                example: "Unknown column 'NaN' in 'where clause'",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getAllUsersSwagger;
