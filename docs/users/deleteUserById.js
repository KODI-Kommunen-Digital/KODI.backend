const deleteUserByIdSwagger = {
    summary: "Delete a user by ID",
    description: "Delete a user based on their ID and auth",
    'tags': ["Users"],
    security: [
        {
            bearerAuth: [],
        },
    ],
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
        }
    ],
    responses: {
        "200": {
            description: "The user was successfully deleted",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                                description: "successfully deleted user",
                            },
                        },
                    },
                },
            },
        },
        "401": {
            description: "No token provided or token expired",
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
        "403": {
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
                                example: "You are not allowed to access this resource",
                            },
                        },
                    },
                },
            },
        },
        "404": {
            description: "Invalid Id",
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
                                example: "Invalid UserId '1'",
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

module.exports = deleteUserByIdSwagger;
