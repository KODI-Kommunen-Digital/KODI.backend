const getAllCitiesSwagger = {
    summary: "Get all cities",
    description: `
      Retrieve all cities from the database. Optionally, filter cities that have a forum by passing the \`hasForum\` query parameter.
    `,
    tags: ["Cities"],
    parameters: [
        {
            in: "query",
            name: "hasForum",
            schema: {
                type: "boolean",
                example: true,
            },
            required: false,
            description: "Filter cities that have a forum (true = has forum). If not provided, all cities are returned.",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched the cities",
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
                                        name: {
                                            type: "string",
                                            example: "New York",
                                        },
                                        image: {
                                            type: "string",
                                            example: "https://example.com/images/city.jpg",
                                        },
                                        hasForum: {
                                            type: "boolean",
                                            example: true,
                                        },
                                    },
                                },
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

module.exports = getAllCitiesSwagger;