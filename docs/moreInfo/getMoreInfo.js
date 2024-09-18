const getMoreInfoSwagger = {
    summary: "Get more info",
    description: "Retrieve more info from the database",
    tags: ["More Info"],
    parameters: [
        {
            in: "query",
            name: "language",
            schema: {
                type: "string",
                minimum: "de",
            },
            description: "The language of response",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched more info from database",
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
                                        id: {
                                            type: "integer",
                                            example: 1,
                                        },
                                        title: {
                                            type: "string",
                                            example: "title",
                                        },
                                        isPdf: {
                                            type: "boolean",
                                            example: false,
                                        },
                                        link: {
                                            type: "string",
                                            example: "https://www.google.com",
                                        },
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

module.exports = getMoreInfoSwagger;
