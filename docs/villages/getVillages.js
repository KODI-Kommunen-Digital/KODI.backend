const getVillegesSwagger = {
    summary: "Get all villages",
    description: "Retrieve all villages based on the cityId",
    tags: ["Villeges"],
    parameters: [
        {
            in: "path",
            name: "cityId",
            schema: {
                type: "integer",
                minimum: 1,
            },
            description: "The id of the city where the villages are in",
        }
    ],
    responses: {
        200: {
            description: "Successfully fetched all villages",
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
                                            example: "first village",
                                        },
                                    }
                                },
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

module.exports = getVillegesSwagger;
