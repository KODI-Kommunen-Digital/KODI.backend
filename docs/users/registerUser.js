const { UserSchema } = require("../models/userModels");

const registerUserSwagger = {
    summary: "Create a user registration",
    description: "Register a new user",
    tags: ["Users"],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: UserSchema,
            },
        },
    },
    responses: {
        200: {
            description: "The user was successfully registered",
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
                                description: "The id of the newly registered user",
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
                                example: "User with username 'johndoe' already exists",
                                description: "The error message",
                            },
                            errorCode: {
                                type: "integer",
                                example: 2005,
                                description: "The error code",
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
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = registerUserSwagger;
