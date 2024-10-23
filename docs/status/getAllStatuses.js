const getAllStatusesSwagger = {
    summary: "Get all statuses",
    description: "Retrieve all statuses from the database",
    tags: ["statuses"],
    responses: {
        200: {
            description: "Successfully fetched the statuses",
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
                                    properties: {
                                        categoryId: {
                                            type: "integer",
                                            example: 1
                                        },
                                        name: {
                                            type: "string",
                                            example: "Active"
                                        }
                                    },
                                }
                            },
                        },
                    },
                },
            }
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

module.exports = getAllStatusesSwagger;
