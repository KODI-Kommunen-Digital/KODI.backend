const getPickupDatesSwagger = {
    summary: "Retrieve pickup dates for a specific street",
    description: "Fetches pickup dates along with waste type information for the specified street in a given city.",
    tags: ["Waste Calender"],
    parameters: [
        {
            name: "streetId",
            in: "path",
            required: true,
            schema: {
                type: "string",
                example: "123",
            },
            description: "The ID of the street for which pickup dates are to be retrieved.",
        },
        {
            name: "cityId",
            in: "query",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
            description: "The ID of the city to which the street belongs.",
        },
    ],
    responses: {
        200: {
            description: "Successfully retrieved pickup dates for the specified street",
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
                                type: "object",
                                additionalProperties: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            dateofPickup: {
                                                type: "string",
                                                format: "date-time",
                                                example: "2024-10-15T00:00:00.000Z",
                                            },
                                            wastetypeName: {
                                                type: "string",
                                                example: "Recyclable Waste",
                                            },
                                            dateEpoch: {
                                                type: "integer",
                                                example: 1697328000,
                                            },
                                            wasteTypeId: {
                                                type: "integer",
                                                example: 1,
                                            },
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
            description: "Invalid city ID or street ID provided",
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
                                example: "An error occurred while retrieving pickup dates: Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = getPickupDatesSwagger;