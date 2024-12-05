const getStreetsSwagger = {
    summary: "Retrieve streets by city ID",
    description: "Fetches a list of streets associated with the given city ID.",
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
            description: "The ID of the city for which the streets are to be retrieved.",
        },
    ],
    responses: {
        200: {
            description: "Successfully retrieved streets for the specified city",
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
                                            description: "The unique identifier for the street.",
                                            example: 1,
                                        },
                                        name: {
                                            type: "string",
                                            description: "The name of the street.",
                                            example: "Main Street",
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
                                example: "An error occurred while retrieving streets: Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getStreetsSwagger;