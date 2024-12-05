const getWasteTypesSwagger = {
    summary: "Retrieve waste types",
    description: "Fetches a list of waste types available for the specified city.",
    tags: ["Waste Calender"],
    parameters: [
        {
            name: "cityId",
            in: "query",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
            description: "The ID of the city for which the waste types are to be retrieved.",
        },
    ],
    responses: {
        200: {
            description: "Successfully retrieved waste types for the specified city",
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
                                            description: "The unique identifier for the waste type.",
                                            example: 1,
                                        },
                                        name: {
                                            type: "string",
                                            description: "The name of the waste type.",
                                            example: "Recyclable Waste",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Invalid city ID provided",
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
                                example: "Invalid CityId '1' given",
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
                                example: "An error occurred while retrieving waste types: Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getWasteTypesSwagger;